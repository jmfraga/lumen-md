/**
 * ProseMirror necesita medidas de layout y observers que jsdom no implementa.
 * Importar este archivo antes de montar un editor en las pruebas.
 */
// ProseMirror necesita medidas de layout que jsdom no implementa.
class NoopObserver {
  observe(): void {
    /* jsdom no implementa observers; no hacen falta para serializar */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
  takeRecords(): never[] {
    return []
  }
}
;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= NoopObserver
;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoopObserver
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as never
  Range.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({})
    }) as DOMRect
}
