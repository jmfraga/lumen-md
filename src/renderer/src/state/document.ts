import { useSyncExternalStore } from 'react'

/**
 * Fuente de verdad del documento: el texto Markdown.
 * WYSIWYG y fuente son vistas; ambas leen y escriben aquí.
 */

export type ViewMode = 'wysiwyg' | 'source'

export interface DocumentState {
  path: string | null
  text: string
  /** Texto tal como está en disco (o como se cargó). */
  savedText: string
  dirty: boolean
  mode: ViewMode
  autosave: boolean
  status: string
}

type Listener = () => void

const AUTOSAVE_DELAY_MS = 800

export class DocumentStore {
  private state: DocumentState = {
    path: null,
    text: '',
    savedText: '',
    dirty: false,
    mode: 'wysiwyg',
    autosave: true,
    status: ''
  }
  private listeners = new Set<Listener>()
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null
  /** Inyectable para pruebas. */
  constructor(private readonly io: { save: (path: string, text: string) => Promise<boolean> }) {}

  get = (): DocumentState => this.state

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  private set(patch: Partial<DocumentState>): void {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }

  load(path: string | null, text: string): void {
    this.cancelAutosave()
    this.set({ path, text, savedText: text, dirty: false, status: '' })
  }

  /** Cambio desde cualquiera de las dos vistas. */
  update(text: string): void {
    if (text === this.state.text) return
    const dirty = text !== this.state.savedText
    this.set({ text, dirty })
    if (dirty && this.state.autosave && this.state.path) this.scheduleAutosave()
  }

  setMode(mode: ViewMode): void {
    this.set({ mode })
  }

  setAutosave(autosave: boolean): void {
    this.set({ autosave })
    if (autosave && this.state.dirty && this.state.path) this.scheduleAutosave()
    if (!autosave) this.cancelAutosave()
  }

  setStatus(status: string): void {
    this.set({ status })
  }

  /** Guarda si hay ruta. Devuelve false si no se pudo (sin ruta o error de disco). */
  async save(): Promise<boolean> {
    this.cancelAutosave()
    const { path, text } = this.state
    if (!path) return false
    const ok = await this.io.save(path, text)
    if (ok) {
      // Si el usuario siguió escribiendo durante el guardado, sigue sucio.
      const stillDirty = this.state.text !== text
      this.set({ savedText: text, dirty: stillDirty, status: 'Guardado' })
    } else {
      this.set({ status: 'Error al guardar' })
    }
    return ok
  }

  /** Tras un "guardar como" exitoso, main ya escribió el archivo. */
  markSavedAs(path: string): void {
    this.set({ path, savedText: this.state.text, dirty: false, status: 'Guardado' })
  }

  flushAutosave(): Promise<boolean> | null {
    if (!this.autosaveTimer) return null
    this.cancelAutosave()
    return this.save()
  }

  private scheduleAutosave(): void {
    this.cancelAutosave()
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null
      void this.save()
    }, AUTOSAVE_DELAY_MS)
  }

  private cancelAutosave(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer)
    this.autosaveTimer = null
  }
}

export function useDocument(store: DocumentStore): DocumentState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
