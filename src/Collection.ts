import path from "path"
import Document, { DocumentData, DocumentWithoutId } from "./Document"
import LocalJsonBase from "./LocalJsonBase"
import { generateRandomId } from "./utils"

export default class Collection<C = DocumentData> {
  readonly path: string
  cache = new Map<string, C | null>()

  constructor(readonly parent: LocalJsonBase | Document, private name: string) {
    this.path = path.join(parent.path, name)
  }

  /** Gets a document reference to the specified path */
  doc(): DocumentWithoutId<C>
  doc(docId: string): Document<C>
  doc(docId?: string) {
    return docId ? new Document<C>(this, docId) : new DocumentWithoutId<C>(this)
  }

  /** Creates and adds a new document in the collection with given data, assigning random auto generated id */
  add(data: C) {
    return this.doc(generateRandomId()).create(data)
  }
}
