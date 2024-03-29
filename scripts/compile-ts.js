#!/usr/bin/env node

const { timed, runMain, getFileSizesAsync, colors, removeTrailingSlash } = require("./lib/utils");
const {
  ROARING_WASM_SRC_FOLDER,
  ROARING_WASM_OUT_FOLDER,
  ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER,
  ROOT_FOLDER,
} = require("./config/paths");
const path = require("path");
const terserConfig = require("./config/terser-config");
const fs = require("fs");
const fastGlob = require("fast-glob");
const prettier = require("prettier");
const { cleanDistFiles } = require("./clean");

const { build: tsupBuild } = require("tsup");

async function compileTs() {
  const outFastGlobOptions = { cwd: ROOT_FOLDER, ignore: ["**/node_modules/**"], onlyFiles: true };

  await cleanDistFiles();

  /** @type {import('tsup').Options} */
  const commonTsupOptions = {
    entry: [path.resolve(ROARING_WASM_SRC_FOLDER, "index.ts")],
    splitting: false,
    sourcemap: false,
    clean: false,
    config: false,
    treeshake: true,
    minify: "terser",
    terserOptions: terserConfig,
    minifySyntax: true,
    target: "es2022",
  };

  const tsupNode = () =>
    timed("tsup node", async () => {
      await tsupBuild({
        ...commonTsupOptions,
        outDir: ROARING_WASM_OUT_FOLDER,
        module: "mjs",
        format: "cjs",
        dts: true,
        skipNodeModulesBundle: true,
        platform: "node",
      });
    });

  const tsupBrowser = () =>
    timed("tsup browser", async () => {
      await tsupBuild({
        ...commonTsupOptions,
        outDir: path.resolve(ROARING_WASM_OUT_FOLDER, "browser"),
        platform: "browser",
        module: "esm",
        format: "es",
        dts: false,
        skipNodeModulesBundle: false,
        esbuildPlugins: [
          {
            name: "import wasm module",
            setup(build) {
              build.onResolve({ filter: /roaring-wasm-module[/\\]?$/i }, (args) => {
                return { path: path.resolve(args.resolveDir, args.path, "index.browser.mjs") };
              });
            },
          },
        ],
      });

      await fs.promises.rename(
        path.resolve(ROARING_WASM_OUT_FOLDER, "browser/index.js"),
        path.resolve(ROARING_WASM_OUT_FOLDER, "browser/index.mjs"),
      );
    });

  await Promise.all([tsupNode(), tsupBrowser()]);

  // Run prettier on the output folder

  await timed("prettier", async () => {
    const files = await fastGlob([`${removeTrailingSlash(ROARING_WASM_OUT_FOLDER)}/**/*.{js,mjs,cjs,ts}`], {
      ...outFastGlobOptions,
      absolute: true,
    });
    await Promise.all(
      files.map(async (file) => {
        const content = await fs.promises.readFile(file, "utf-8");
        const fcontent = await prettier.format(content, {
          filepath: file,
          parser: file.endsWith(".ts") ? "typescript" : "espree",
        });
        if (fcontent !== content) {
          await fs.promises.writeFile(file, fcontent);
        }
      }),
    );
  });

  const copyWasmFile = () => {
    return fs.promises.copyFile(
      path.resolve(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, "index.wasm"),
      path.resolve(ROARING_WASM_OUT_FOLDER, "index.wasm"),
    );
  };

  const copyIndexDTsToBrowser = () =>
    fs.promises.copyFile(
      path.resolve(ROARING_WASM_OUT_FOLDER, "index.d.ts"),
      path.resolve(ROARING_WASM_OUT_FOLDER, "browser/index.d.ts"),
    );

  await Promise.all([copyWasmFile(), copyIndexDTsToBrowser()]);

  // Print file sizes

  console.log();
  for (const f of await getFileSizesAsync(
    [`${removeTrailingSlash(ROARING_WASM_OUT_FOLDER)}/**/*.{js,mjs,cjs,ts,wasm}`],
    outFastGlobOptions,
  )) {
    console.log(`${colors.magentaBright("•")} ${colors.green(f.path)} ${colors.cyanBright(`${f.sizeString}`)}`);
  }
  console.log();
}

module.exports = { compileTs };

if (require.main === module) {
  runMain(compileTs);
}
