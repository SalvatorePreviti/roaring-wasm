#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const globby = require("fast-glob");
const emccConfig = require("./config/emcc-config");
const prettier = require("prettier");
const {
  colors,
  getFileSizesAsync,
  spawnAsync,
  ROOT_FOLDER,
  timed,
  executablePathFromEnv,
  runMain,
} = require("./lib/utils");

function emcc(files) {
  const emccPath = executablePathFromEnv("EMSCRIPTEN", null, "emcc");

  return spawnAsync(emccPath, [...files, ...emccConfig.args, "-o", emccConfig.out], {
    cwd: ROOT_FOLDER,
    env: {
      ...process.env,
      NODE_JS: process.execPath,
      EMCC_CFLAGS: `${emccConfig.cflags.join(" ")} ${process.env.EMCC_CLOSURE_ARGS || ""}`,
      EMMAKEN_CXXFLAGS: `${emccConfig.cflags.join(" ")} ${process.env.EMCC_CLOSURE_ARGS || ""}`,
    },
  });
}

async function writeRoaringWasmModuleTs() {
  const sourceFilePath = path.resolve(ROOT_FOLDER, emccConfig.out);
  const targetFilePath = path.resolve(ROOT_FOLDER, "src/ts/lib/roaring-wasm/roaring-wasm-module.ts");

  let content = await fs.promises.readFile(sourceFilePath, "utf8");

  content = content.replace('var Module = typeof Module != "undefined" ? Module : {};', "");

  content += '\nModule["wasmMemory"] = wasmMemory;\n';

  let moduleContent = '"use strict";\n';
  moduleContent += "const roaring_wasm_module_init = (Module={}) => {\n";
  moduleContent += content;
  moduleContent += "\nreturn Module;\n";
  moduleContent += "\n};\n";
  moduleContent += "\nexport default roaring_wasm_module_init;\n";

  moduleContent = prettier.format(moduleContent, { parser: "typescript" });

  // Add preamble
  let output =
    "// @ts-nocheck\n" +
    "// prettier-ignore\n" +
    "/* eslint-disable */\n" +
    "// This file is generated by scripts/compile-wasm.js\n";

  output += moduleContent;

  await fs.promises.writeFile(targetFilePath, output);
}

async function compileWasm() {
  await fs.promises.mkdir(path.join(ROOT_FOLDER, path.dirname(emccConfig.out)), { recursive: true });

  await timed("emcc", async () => {
    const files = await globby(emccConfig.files, { cwd: ROOT_FOLDER });
    console.log(colors.blueBright(`• emcc ${files.join(" ")}`));
    return emcc(files);
  });

  const fileSizes = await getFileSizesAsync(`${emccConfig.out.substr(0, emccConfig.out.lastIndexOf("."))}.*`);
  for (const f of fileSizes) {
    console.log(`• ${colors.green(f.path)} ${colors.cyanBright(`${f.sizeString}`)}`);
  }

  await timed("wasm ts module", () => writeRoaringWasmModuleTs());
}

module.exports = { compileWasm };

if (require.main === module) {
  runMain(compileWasm);
}
