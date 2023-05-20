#!/usr/bin/env node

const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const { runMain } = require("./lib/utils");
const { ROOT_FOLDER } = require("./config/paths");

async function loadProject(tsconfigFile) {
  const configFileName = tsconfigFile;
  const configFileText = await fs.promises.readFile(configFileName, "utf8");
  const result = ts.parseConfigFileTextToJson(configFileName, configFileText);
  const configObject = result.config;
  const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName));
  return configParseResult;
}

/** @type {{parent:any; tsconfigPath:string; tsconfig: ts.ParsedCommandLine; files:Set<string>}} */
const projectsStack = [];

const projects = [];

const exploredDirectories = new Set();

/** @type {Map<string, {parent:any; tsconfigPath:string; tsconfig: ts.ParsedCommandLine; files:Set<string>}>} */
const filesMap = new Map();

const exploreDir = async (dir) => {
  if (exploredDirectories.has(dir)) {
    return;
  }
  exploredDirectories.add(dir);

  const dirBasename = path.basename(dir).toLowerCase();
  if (dirBasename === "node_modules" || dirBasename.startsWith(".")) {
    return; // ignored directory
  }

  const items = await fs.promises.readdir(dir, { withFileTypes: true });

  const tsconfigEntry = items.find((item) => item.isFile() && item.name === "tsconfig.json");

  let project = projectsStack[projectsStack.length - 1];

  if (tsconfigEntry) {
    const tsconfigPath = path.resolve(dir, tsconfigEntry.name);

    // Load the tsconfig
    const tsconfig = await loadProject(tsconfigPath);

    project = {
      parent: project,
      tsconfigPath,
      tsconfig,
      files: new Set(),
    };

    // push in the stack
    projectsStack.push(project);
    projects.push(project);
  }

  // Recurse subdirectories
  const promises = [];
  for (const item of items) {
    if (item.isDirectory()) {
      promises.push(exploreDir(path.resolve(dir, item.name)));
    }
  }
  if (promises.length) {
    await Promise.all(promises);
  }

  if (tsconfigEntry) {
    for (let file of project.tsconfig.fileNames) {
      file = path.resolve(dir, file);

      if (!filesMap.has(file) && !file.includes("node_modules")) {
        filesMap.set(file, project);
        project.files.add(file);
      }
    }

    projectsStack.pop();
  }
};

async function typecheckWorkspace(rootDir = ROOT_FOLDER) {
  await exploreDir(path.resolve(rootDir));

  for (const project of projects) {
    const files = Array.from(project.files);
    const program = ts.createProgram(files, project.tsconfig.options);

    const diagnostics = ts.getPreEmitDiagnostics(program);

    const host = ts.createCompilerHost(project.tsconfig.options);
    const formatHost = {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: host.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    };
    console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
  }
}

if (require.main === module) {
  runMain(typecheckWorkspace, "typecheck");
}
