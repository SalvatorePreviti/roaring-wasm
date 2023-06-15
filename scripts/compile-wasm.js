#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const fastGlob = require("fast-glob");
const prettier = require("prettier");
const exportedFunctions = require("./config/exportedFunctions");
const {
  colors,
  getFileSizesAsync,
  spawnAsync,
  timed,
  executablePathFromEnv,
  runMain,
  prettyElapsedTime,
  removeTrailingSlash,
} = require("./lib/utils");
const {
  ROARING_WASM_CPP_SRC_FOLDER,
  ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER,
  ROARING_WASM_EMCC_BUILD_FOLDER,
  ROOT_FOLDER,
} = require("./config/paths");

function buildLinkArgs(environment) {
  const linkargs = [];

  // see https://github.com/kripken/emscripten/blob/master/src/settings.js

  if (environment === "browser") {
    linkargs.push("-s", "SINGLE_FILE");
  }

  linkargs.push("-s", `EXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`);
  linkargs.push("-s", "INCOMING_MODULE_JS_API=[]");

  linkargs.push("-s", `WASM_ASYNC_COMPILATION=${environment === "browser" ? "1" : "0"}`);

  linkargs.push("-s", "ALLOW_MEMORY_GROWTH=1");
  linkargs.push("-s", "DISABLE_EXCEPTION_CATCHING=1");
  linkargs.push("-s", "INVOKE_RUN=1");
  linkargs.push("-s", "MODULARIZE=1");
  linkargs.push("-s", "FILESYSTEM=0");
  linkargs.push("-s", "EXIT_RUNTIME=0");
  linkargs.push("-s", "FILESYSTEM=0");
  linkargs.push("-s", "NODEJS_CATCH_EXIT=0");
  linkargs.push("-s", "NODEJS_CATCH_REJECTION=0");
  linkargs.push("-s", "ABORTING_MALLOC=0");
  linkargs.push("-s", "SUPPORT_LONGJMP=0");
  linkargs.push("-s", "EXPORT_NAME=roaring_wasm");
  linkargs.push("-s", "MIN_NODE_VERSION=160000");
  linkargs.push("-s", `ENVIRONMENT=${environment === "browser" ? "web,worker" : "node"}`);

  linkargs.push("-s", "ASSERTIONS"); // useful when debugging

  if (environment === "browser") {
    linkargs.push("-s", "USE_ES6_IMPORT_META=0");
  }

  // optimizations
  linkargs.push("-s", "EVAL_CTORS=2");
  linkargs.push("-s", "AGGRESSIVE_VARIABLE_ELIMINATION=1");
  linkargs.push("-s", "ASSERTIONS=0");

  // optimizations
  linkargs.push("-flto=full");
  linkargs.push("-ffast-math");
  linkargs.push("-fno-exceptions");

  // js settings
  linkargs.push("--output_eol", "linux");
  linkargs.push("--closure", "0");

  return linkargs;
}

async function compileWasm() {
  process.chdir(ROOT_FOLDER);

  const emccPath = executablePathFromEnv("EMSCRIPTEN", null, "emcc");

  const emccFlags = [];
  emccFlags.push(`-I${ROOT_FOLDER}`);
  emccFlags.push("-Isubmodules/CRoaring/include");
  emccFlags.push("-O3");
  emccFlags.push("-g0");
  emccFlags.push("-msimd128");
  emccFlags.push("-mfpu=neon");
  // emccFlags.push("-DCROARING_USENEON");
  // emccFlags.push("-DSIMDE_NO_CONVERT_VECTOR");

  const cflags = [];
  cflags.push("-O3");
  cflags.push("-Wall");
  cflags.push("-Wno-error=unused-local-typedefs");
  cflags.push("-flto=full");
  cflags.push("-ffast-math");
  cflags.push("-fno-exceptions");

  const emccSpawnOptions = {
    cwd: ROOT_FOLDER,
    env: {
      ...process.env,
      NODE_JS: process.execPath,
      EMCC_CFLAGS: `${cflags.join(" ")} ${process.env.EMCC_CFLAGS || ""}`,
      EMMAKEN_CXXFLAGS: `${cflags.join(" ")} ${process.env.EMMAKEN_CXXFLAGS || ""}`,
    },
  };

  await fs.promises.rm(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, { recursive: true, force: true });

  await Promise.all([
    fs.promises.mkdir(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, { recursive: true }),
    fs.promises.mkdir(ROARING_WASM_EMCC_BUILD_FOLDER, { recursive: true }),
  ]);

  const oFiles = [];
  const srcFiles = await fastGlob([`${removeTrailingSlash(ROARING_WASM_CPP_SRC_FOLDER)}/**/*.{c,cpp}`], {
    onlyFiles: true,
    cwd: ROOT_FOLDER,
  });

  const compileObjectFile = async (file) => {
    const start = performance.now();
    let ofile = path.relative(ROARING_WASM_CPP_SRC_FOLDER, file);
    ofile = path.join("build", "emcc", `${ofile.slice(0, ofile.lastIndexOf("."))}.o`);
    oFiles.push(ofile);
    await spawnAsync(emccPath, [file, ...emccFlags, "-c", "-o", ofile], emccSpawnOptions);
    console.log(
      `${colors.magenta(" - compile")} ${colors.magentaBright(ofile.padEnd(30, " "))} ${colors.gray(
        ` ${prettyElapsedTime(performance.now() - start)}`,
      )}`,
    );
  };

  await timed("emcc compile", async () => {
    await spawnAsync(emccPath, ["--version"], {});
    const promises = [];
    for (const file of srcFiles) {
      promises.push(compileObjectFile(file));
    }
    return Promise.all(promises);
  });

  const emccLink = (environment, ofile) => {
    return timed(`emcc link ${environment}`, async () => {
      const start = performance.now();
      const filename = path.resolve(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, ofile);

      console.log(colors.blueBright(` - linking ${path.relative(ROOT_FOLDER, filename)}`));

      await spawnAsync(
        emccPath,
        [...oFiles, ...emccFlags, ...buildLinkArgs(environment), "-o", filename],
        emccSpawnOptions,
      );

      let src = await fs.promises.readFile(filename, "utf8");

      src = src.replace('typeof atob == "function"', "true").replace('"function" == typeof atob', true);

      src = `// AUTO-GENERATED: This file was autogenerated by scripts/compile-wasm.js, do not modify.\n\n${src}`;

      if (environment === "node") {
        src = `"use strict";\n${src}`;
        src = `if (typeof exports === "object")\nObject.defineProperty(exports, "__esModule", { value: true });\n${src}`;
        src += 'if (typeof exports === "object")\nexports.default = roaring_wasm;';
      }

      src = prettier.format(src, { parser: "espree" });

      await fs.promises.writeFile(filename, src);

      console.log(
        `${colors.magenta(" - link")} ${colors.magentaBright(ofile.padEnd(30, " "))} ${colors.gray(
          ` ${prettyElapsedTime(performance.now() - start)}`,
        )}`,
      );
      return filename;
    });
  };

  const emccBuildNode = async () => {
    await emccLink("node", "index.js");
  };

  const emccBuildBrowser = async () => {
    await emccLink("browser", "index.browser.mjs");
  };

  const buildDts = async () => {
    let content = "";
    content += "// AUTO-GENERATED: This file was autogenerated by scripts/compile-wasm.js, do not modify.\n\n";
    content += "declare const roaring_wasm_module_init: <TModule>(Module?: any) => TModule;\n\n";
    content += "export default roaring_wasm_module_init;\n";
    await fs.promises.writeFile(path.resolve(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, "index.d.ts"), content);
  };

  await timed("emcc link", () => Promise.all([emccBuildNode(), emccBuildBrowser(), buildDts()]));

  const fileSizes = await getFileSizesAsync([
    `${removeTrailingSlash(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER)}/**/*.{js,mjs,cjs,wasm}`,
  ]);
  console.log();
  for (const f of fileSizes) {
    console.log(`• ${colors.green(f.path)} ${colors.cyanBright(`${f.sizeString}`)}`);
  }
  console.log();
}

module.exports = { compileWasm };

if (require.main === module) {
  runMain(compileWasm);
}
