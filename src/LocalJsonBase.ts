import fs from "fs"
import path from "path"
import Collection from "./Collection"
import { DocumentData } from "./Document"

export default class LocalJsonBase {
  readonly rootFolder: string

  constructor(rootFolder: string) {
    this.rootFolder = path.join(path.dirname(require.main!.filename), rootFolder)
  }
  collection<C = DocumentData>(collectionName: string) {
    return new Collection<C>(this, collectionName)
  }

  get path() {
    return this.rootFolder
  }
}
