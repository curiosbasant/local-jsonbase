import { existsSync as doesPathExist } from "fs"
import fs from "fs/promises"
import path from "path"
import Collection from "./Collection"
import { generateRandomId } from "./utils"

export type DocumentData = Record<string, any>
type SetOptions = { merge?: boolean; mergeFields?: string[] }

// So it dont have other write methods
export class DocumentWithoutId<D> {
  readonly path: string

  constructor(readonly parent: Collection<D>, readonly id = generateRandomId()) {
    this.path = path.join(parent.path, this.id)
  }

  async create(data: D) {
    if (doesPathExist(this.filePath)) {
      throw new Error("Data already exists")
    }
    // TODO: optimize and error on path exist
    // await fs.mkdir(this.parent.path, { recursive: true })
    const obj = { ...data, _id: this.id }
    await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2)).catch(async () => {
      await fs.mkdir(this.parent.path, { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2))
    })
    this.save(obj)
    return this
  }

  protected async save(obj: D | null) {
    this.parent.cache.set(this.id, obj)
    // await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2))
  }

  protected get filePath() {
    return `${this.path}.json`
  }
}

export default class Document<D = DocumentData> extends DocumentWithoutId<D> {
  constructor(parent: Collection<D>, docId: string) {
    super(parent, docId)
  }

  /** Get the collection reference within `this` doc */
  collection<C>(collectionName: string): Collection<C> {
    return new Collection<C>(this, collectionName)
  }

  /**
   * Get the data from the doc file
   * @param fromCache - A boolean value, indicating whether to try get the data from cache. Defaults to `true`
   * @returns The doc file data if exists, `null` otherwise
   * */
  async get(fromCache = true): Promise<D | null> {
    if (fromCache && this.parent.cache.has(this.id)) return <D>this.parent.cache.get(this.id)

    let obj: D | null
    try {
      const data = await fs.readFile(this.filePath, "utf-8")
      obj = <D>JSON.parse(data)
    } catch {
      obj = null
    }
    this.save(obj)
    return obj
  }

  /**
   * Tries to update the doc file, if exists.
   * @param data - The data object to set
   * @param merge - A boolean value, indicating whether to merge or replace content of doc file data, if already exists
   * @returns `this`
   * */
  set(data: Partial<D>, merge: true): Promise<this>
  async set(data: D, merge = false) {
    let toSave = data
    if (merge) {
      let draft = await this.get()
      if (draft != null) toSave = Object.assign(draft, data)
    }
    await fs.writeFile(this.filePath, JSON.stringify(toSave, null, 2)).catch(async () => {
      await fs.mkdir(this.parent.path, { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(toSave, null, 2))
    })

    this.save(toSave)
    return this
  }

  /**
   * Tries to update the doc file, if exists.
   * @param data - The data object to update
   * @returns The updated doc file data
   * */
  async update(data: Partial<D>) {
    const draft = await this.get()
    if (draft == null) {
      throw new Error("No Data Exists!")
    }
    const obj: D = { ...draft, ...data }
    await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2))
    this.save(obj)
    return obj
  }

  /**
   * Tries to delete the doc file, if exists.
   * @returns boolean - if successful
   * */
  async delete() {
    try {
      await fs.unlink(this.filePath)
      this.parent.cache.delete(this.id)
      return true
    } catch {
      return false
    }
  }
}
