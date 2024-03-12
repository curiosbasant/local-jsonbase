import fs from "fs"
import path from "path"
import Collection from "./Collection"
import { DocumentData } from "./Document"
import { getProjectRoot } from "./utils"

export default class LocalJsonBase {
  readonly rootFolder: string

  constructor(rootFolder: string) {
    this.rootFolder = path.join(getProjectRoot(), rootFolder)
  }
  collection<C = DocumentData>(collectionName: string) {
    return new Collection<C>(this, collectionName)
  }

  get path() {
    return this.rootFolder
  }
}
