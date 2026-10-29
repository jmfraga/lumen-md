import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Preferences } from '../shared/ipc'
import { detectLang, isLang, type Lang } from '../shared/i18n'

/** Persistencia mínima en userData/lumen.json: preferencias y recientes. Sin dependencias. */

/** En disco el idioma es opcional: sin elección explícita se sigue al sistema. */
type StoredPreferences = Omit<Preferences, 'language'> & { language?: Lang }

interface StoreData {
  preferences: StoredPreferences
  recents: string[]
}

const DEFAULTS: StoreData = {
  preferences: { autosave: true, checkUpdates: true },
  recents: []
}

const MAX_RECENTS = 10

function storePath(): string {
  return join(app.getPath('userData'), 'lumen.json')
}

let cache: StoreData | null = null

function load(): StoreData {
  if (cache) return cache
  try {
    const raw = JSON.parse(readFileSync(storePath(), 'utf8')) as Partial<StoreData>
    cache = {
      preferences: { ...DEFAULTS.preferences, ...(raw.preferences ?? {}) },
      recents: Array.isArray(raw.recents) ? raw.recents.filter((r) => typeof r === 'string') : []
    }
  } catch {
    cache = { preferences: { ...DEFAULTS.preferences }, recents: [] }
  }
  return cache
}

function persist(): void {
  const data = load()
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(storePath(), JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.error('[lumen] no se pudo guardar lumen.json', err)
  }
}

/** Idioma del sistema. LUMEN_LANG lo fuerza (pruebas y capturas). */
export function systemLang(): Lang {
  const forced = process.env['LUMEN_LANG']
  if (isLang(forced)) return forced
  const preferred = app.getPreferredSystemLanguages?.()[0]
  return detectLang(preferred || app.getLocale())
}

function resolve(prefs: StoredPreferences): Preferences {
  const forced = process.env['LUMEN_LANG']
  const language = isLang(forced) ? forced : isLang(prefs.language) ? prefs.language : systemLang()
  return { ...prefs, language }
}

export function getPreferences(): Preferences {
  return resolve(load().preferences)
}

export function getLang(): Lang {
  return getPreferences().language
}

export function setPreferences(patch: Partial<Preferences>): Preferences {
  const data = load()
  data.preferences = { ...data.preferences, ...patch }
  persist()
  return resolve(data.preferences)
}

export function getRecents(): string[] {
  return [...load().recents]
}

export function addRecent(path: string): void {
  const data = load()
  data.recents = [path, ...data.recents.filter((p) => p !== path)].slice(0, MAX_RECENTS)
  if (process.platform === 'darwin') app.addRecentDocument(path)
  persist()
}

export function clearRecents(): void {
  const data = load()
  data.recents = []
  if (process.platform === 'darwin') app.clearRecentDocuments()
  persist()
}
