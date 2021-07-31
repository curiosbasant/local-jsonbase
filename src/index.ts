import fs from "fs"
import path from "path"

export default class LocalJSONBase {
  collections = new Map<string, Collection>()
  readonly rootFolder: string
  constructor(dbFolderName: string) {
    this.rootFolder = path.join(path.dirname(require.main!.filename), dbFolderName)
  }
  collection<T>(collectionName: string) {
    return new Collection<T>(this, collectionName)
  }
}

export class Collection<T = DocumentData> {
  readonly path: string
  readonly documents = new Map<string, Document<T>>()
  private directoryExists: boolean
  constructor(readonly jsonDb: LocalJSONBase, readonly id: string) {
    this.path = path.join(jsonDb.rootFolder, id)
    this.directoryExists = fs.existsSync(this.path)
  }
  async add(data: T) {
    if (!this.directoryExists) {
      this.directoryExists = true
    }
    const rID = `${Math.random()}`.slice(2)
    const document = new Document<T>(this, rID, data)
    this.documents.set(rID, document)
    return document
  }

  async getDoc(id: string) {
    return (
      this.documents.get(id) ??
      fs.promises
        .readFile(path.join(this.path, `${id}.json`), "utf-8")
        .then((data) => JSON.parse(data))
        .catch(() => null)
        .then((obj) => {
          const document = new Document<T>(this, id, obj)
          this.documents.set(id, document)
          return document
        })
    )
  }
  get() {}
}

type SetOptions = { merge?: boolean; mergeFields?: string[] }
class Document<T> {
  private fileCreated = false
  constructor(readonly parent: Collection<T>, readonly id: string, public data: T | null) {
    if (data) {
      //
      this.fileCreated = fs.existsSync(this.parent.path)
      this.save()
    }
  }
  set(data: T, setOptions?: SetOptions) {
    if (this.data && setOptions?.merge) {
      Object.assign(this.data, data)
    } else {
      this.data = data
    }
    this.save()
  }
  update(data: Partial<T>) {
    if (!this.data) return
    Object.assign(this.data, data)

    this.save()
  }
  delete() {
    this.parent.documents.delete(this.id)
    fs.unlink(this.filePath, this.onError)
  }
  private async save() {
    if (!this.fileCreated) {
      await fs.promises.mkdir(this.parent.path, { recursive: true })
      this.fileCreated = true
    }

    await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2))
  }
  private onError(err: NodeJS.ErrnoException | null) {
    err && console.error(err)
  }
  get filePath() {
    return path.join(this.parent.path, `${this.id}.json`)
  }
}

interface DocumentData {}
