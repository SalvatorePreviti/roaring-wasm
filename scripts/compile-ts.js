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

const { build: tsupBuild } = require("tsup");

async function compileTs() {
  /** @type {import('tsup').Options} */
  const commonTsupOptions = {
    entry: [path.resolve(ROARING_WASM_SRC_FOLDER, "index.ts")],
    splitting: false,
    sourcemap: false,
    clean: false,
    tsconfig: "tsconfig-build.json",
    config: false,
    treeshake: true,
    minify: "terser",
    terserOptions: terserConfig,
    minifySyntax: true,
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
    });

  const copyWasmFile = () => {
    return fs.promises.copyFile(
      path.resolve(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, "index.wasm"),
      path.resolve(ROARING_WASM_OUT_FOLDER, "index.wasm"),
    );
  };

  await Promise.all([tsupNode(), tsupBrowser(), copyWasmFile()]);

  // Copy index.d.ts file to browser folder
  await fs.promises.copyFile(
    path.resolve(ROARING_WASM_OUT_FOLDER, "index.d.ts"),
    path.resolve(ROARING_WASM_OUT_FOLDER, "browser/index.d.ts"),
  );

  // Run prettier on the output folder

  const outFastGlobOptions = { cwd: ROOT_FOLDER, ignore: ["**/node_modules/**"], onlyFiles: true };

  await timed("prettier", async () => {
    const files = await fastGlob([`${removeTrailingSlash(ROARING_WASM_OUT_FOLDER)}/**/*.{js,mjs,cjs,ts}`], {
      ...outFastGlobOptions,
      absolute: true,
    });
    await Promise.all(
      files.map(async (file) => {
        const content = await fs.promises.readFile(file, "utf-8");
        const formatted = prettier.format(content, {
          filepath: file,
          parser: file.endsWith(".ts") ? "typescript" : "espree",
        });
        if (formatted !== content) {
          await fs.promises.writeFile(file, formatted);
        }
      }),
    );
  });

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
