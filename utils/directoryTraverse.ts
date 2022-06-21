import { existsSync, lstatSync, readdirSync } from 'fs-extra'
import { resolve } from 'path'

export function preOrderDirectoryTraverse(dir:string, dirCallback:(dir:string)=>void, fileCallback:(file:string)=>void) {
  for (const filename of readdirSync(dir)) {
    const fullpath = resolve(dir, filename)
    if (lstatSync(fullpath).isDirectory()) {
      dirCallback(fullpath)
      // in case the dirCallback removes the directory entirely
      if (existsSync(fullpath)) {
        preOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      }
      continue
    }
    fileCallback(fullpath)
  }
}

export function postOrderDirectoryTraverse(dir:string, dirCallback:(dir:string)=>void, fileCallback:(file:string)=>void) {
  for (const filename of readdirSync(dir)) {
    const fullpath = resolve(dir, filename)
    if (lstatSync(fullpath).isDirectory()) {
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      dirCallback(fullpath)
      continue
    }
    fileCallback(fullpath)
  }
}