import { compileCode, compileFile } from 'bytenode';
import { readFileSync, readdirSync, statSync, rmSync, existsSync, mkdirSync } from 'fs';
import path, { resolve, sep as pathSeparator } from 'path';

const files = new Set<string>();
traverseDirectory('./dist', (filePath) => collectFile(filePath, files));

if (!existsSync('./build')) {
  mkdirSync('./build');
} else {
  console.log('asdasdasd');
  rmSync('./build', { recursive: true });
  mkdirSync('./build');
}
console.log('abc');
files.forEach(filePath => {
  const filename = 'build/' + filePath.split(pathSeparator).pop()?.split('.').slice(0, -1).join('.') + '.jsc';
  compileFile({
    filename: filePath,
    createLoader: false,
    compileAsModule: true,
    electron: false,
    loaderFilename: undefined,
    output: filename,
  }, filename);
});

function traverseDirectory(dirPath: string, callback: (filePath: string) => any) {
  const stack = [dirPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    if (!currentPath) return;

    const files = readdirSync(currentPath);
    if (files.length == 0) rmSync(currentPath, { recursive: false });

    files.forEach((file) => {
      const filePath = resolve(currentPath, file);
      const stats = statSync(filePath);

      if (stats.isFile()) {
        callback(filePath);
      } else if (stats.isDirectory()) {
        stack.push(filePath);
      }
    });
  }
}


function collectFile(filePath: string, filesSet: Set<string>) {
  if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
    throw new Error(`Unexpected TypeScript file: ${filePath.split(pathSeparator).pop()}\nFilePath: ${filePath}`);
  }
  if (!filePath.endsWith('.js')) rmSync(filePath);
  else filesSet.add(filePath);
}
