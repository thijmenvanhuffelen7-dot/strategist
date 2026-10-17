/**
 * Ingebouwde opslag: alle data staat lokaal in de browser (IndexedDB).
 * Geen account of server nodig. Elke tabel is een object store met records die een `id` hebben.
 */

export const TABLES = [
  'projects',
  'research',
  'angles',
  'hooks',
  'briefs',
  'swipe_items',
  'brief_swipe_links',
  'tests',
  'prompt_templates',
  'ai_outputs',
  'media',
  'meta',
] as const
export type Table = (typeof TABLES)[number]

/** Tabellen met een project_id; worden mee verwijderd met het project. */
const PROJECT_CHILDREN: Table[] = ['research', 'angles', 'hooks', 'briefs', 'tests', 'ai_outputs']

const DB_NAME = 'strategist-os'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      for (const t of TABLES) {
        if (!req.result.objectStoreNames.contains(t)) req.result.createObjectStore(t, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Kon de lokale database niet openen'))
  })
  return dbPromise
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function store(table: Table, mode: IDBTransactionMode = 'readonly') {
  return (await open()).transaction(table, mode).objectStore(table)
}

export function newId() {
  return crypto.randomUUID()
}

export const db = {
  async list<T>(table: Table): Promise<T[]> {
    return wrap((await store(table)).getAll()) as Promise<T[]>
  },

  async get<T>(table: Table, id: string): Promise<T | undefined> {
    return wrap((await store(table)).get(id)) as Promise<T | undefined>
  },

  async put<T extends { id: string }>(table: Table, record: T): Promise<T> {
    await wrap((await store(table, 'readwrite')).put(record))
    return record
  },

  async remove(table: Table, id: string): Promise<void> {
    await wrap((await store(table, 'readwrite')).delete(id))
  },

  /** Verwijdert een project inclusief alle onderzoek, angles, hooks, briefs, tests en AI-output. */
  async removeProject(id: string): Promise<void> {
    const conn = await open()
    const tx = conn.transaction(['projects', ...PROJECT_CHILDREN], 'readwrite')
    tx.objectStore('projects').delete(id)
    for (const t of PROJECT_CHILDREN) {
      const s = tx.objectStore(t)
      const all = (await wrap(s.getAll())) as { id: string; project_id?: string }[]
      for (const r of all) if (r.project_id === id) s.delete(r.id)
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /** Volledige back-up van alle tabellen (media als data-URL's). */
  async exportAll(): Promise<Record<string, unknown[]>> {
    const out: Record<string, unknown[]> = {}
    for (const t of TABLES) out[t] = await db.list(t)
    return out
  },

  /** Zet een back-up terug. Vervangt alle bestaande data. */
  async importAll(data: Record<string, unknown[]>): Promise<void> {
    const conn = await open()
    const tx = conn.transaction([...TABLES], 'readwrite')
    for (const t of TABLES) {
      const s = tx.objectStore(t)
      s.clear()
      for (const r of data[t] ?? []) s.put(r)
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },
}

/** Vraag de browser om de data niet automatisch op te ruimen bij weinig schijfruimte. */
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {})
}
