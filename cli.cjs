#!/usr/bin/env node

const yargs = require("yargs");
const { DoubleUCGenerator } = require("./dist/index.js");
const fs = require("fs");
const path = require("path");

yargs
  .command(["generate [path]", "gen [path]", "g [path]"], "Generate Web Component", (yargs) => {
    return yargs
      .positional("path", {
        describe: "Path to declaration file/directory",
        demandOption: true
      });
  }, (argv) => {
    if (argv.path.toString().endsWith(".js")) {
      generateFile(path.resolve(argv.path)).then(() => console.log("Done!")).catch((err) => console.error(err));
    } else {
      const fileList = getAllFilesWithExtension(argv.path, ".js");
      generateFiles(fileList).then(() => console.log("Done!")).catch((err) => console.error(err));
    }
  })
  .parse();

async function generateFiles(filesPaths) {
  for (const filePath of filesPaths) {
    await generateFile(filePath);
  }
}

async function generateFile(path) {
  const declaration = require(path);
  const generator = new DoubleUCGenerator(declaration);
  const file = await generator.generateWebComponent();
  console.log(`Generated ${file}`);
}

function getAllFilesWithExtension(dirPath, ext, filesList = []) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      getAllFilesWithExtension(filePath, ext, filesList);
    } else if (path.extname(file) === ext) {
      filesList.push(path.resolve(filePath));
    }
  }

  return filesList;
}