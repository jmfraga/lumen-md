import { describe, it, expect, vi } from 'vitest'
import { DocumentStore } from '../src/renderer/src/state/document'

describe('DocumentStore', () => {
  it('marca dirty solo cuando el texto difiere del guardado', () => {
    const store = new DocumentStore({ save: async () => true })
    store.load('/x.md', 'hola')
    expect(store.get().dirty).toBe(false)
    store.update('hola!')
    expect(store.get().dirty).toBe(true)
    store.update('hola')
    expect(store.get().dirty).toBe(false)
  })

  it('autoguarda tras 800 ms si hay ruta', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async () => true)
    const store = new DocumentStore({ save })
    store.load('/x.md', 'a')
    store.update('ab')
    store.update('abc')
    expect(save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(800)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('/x.md', 'abc')
    expect(store.get().dirty).toBe(false)
    vi.useRealTimers()
  })

  it('no autoguarda sin ruta ni con autosave apagado', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async () => true)
    const store = new DocumentStore({ save })
    store.load(null, '')
    store.update('x')
    await vi.advanceTimersByTimeAsync(2000)
    expect(save).not.toHaveBeenCalled()
    store.load('/y.md', '')
    store.setAutosave(false)
    store.update('y')
    await vi.advanceTimersByTimeAsync(2000)
    expect(save).not.toHaveBeenCalled()
    expect(store.get().dirty).toBe(true)
    vi.useRealTimers()
  })

  it('sigue dirty si el usuario escribió durante el guardado', async () => {
    let resolve!: (v: boolean) => void
    const store = new DocumentStore({ save: () => new Promise<boolean>((r) => (resolve = r)) })
    store.load('/x.md', 'a')
    store.setAutosave(false)
    store.update('ab')
    const p = store.save()
    store.update('abc')
    resolve(true)
    await p
    expect(store.get().dirty).toBe(true)
    expect(store.get().savedText).toBe('ab')
  })
})
