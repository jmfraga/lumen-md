/**
 * Buscar dentro del documento (vista WYSIWYG).
 *
 * Recorre el texto visible del editor y pinta las coincidencias con la API
 * CSS Custom Highlight: no toca el DOM de ProseMirror ni la selección, funciona
 * también dentro de los bloques de código (CodeMirror) y no pesa nada.
 * La vista de fuente usa el buscador propio de CodeMirror.
 */

/**
 * Pliega un texto para comparar sin distinguir mayúsculas ni acentos
 * ("busqueda" encuentra "Búsqueda"). Conserva la longitud carácter por carácter
 * para que los índices del texto plegado sirvan sobre el original.
 */
export function foldText(text: string): string {
  const out = new Array<string>(text.length)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // ASCII (casi todo el texto): solo minúsculas, sin normalizar.
    if (code < 128) out[i] = code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : text[i]
    else out[i] = foldChar(text[i])
  }
  return out.join('')
}

// Un documento usa pocos caracteres distintos: normalizar cada uno una sola vez.
const folded = new Map<string, string>()
function foldChar(c: string): string {
  let f = folded.get(c)
  if (f === undefined) {
    const n = c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    f = n.length === 1 ? n : c
    folded.set(c, f)
  }
  return f
}

/** Posiciones [inicio, fin) de cada coincidencia, sin traslapes. */
export function findInText(text: string, query: string): Array<[number, number]> {
  const q = foldText(query)
  if (!q) return []
  const hay = foldText(text)
  const out: Array<[number, number]> = []
  let i = hay.indexOf(q)
  while (i !== -1) {
    out.push([i, i + q.length])
    i = hay.indexOf(q, i + q.length)
  }
  return out
}

const BLOCK =
  'p,li,td,th,h1,h2,h3,h4,h5,h6,pre,blockquote,figcaption,.cm-line,.milkdown-code-block,div'

/** Rangos del DOM con cada coincidencia visible dentro de `root`. */
export function findRanges(root: HTMLElement, query: string): Range[] {
  if (!query) return []
  // Texto visible, con un separador entre bloques distintos para no unir
  // el final de un párrafo con el inicio del siguiente.
  const nodes: Array<{ node: Text; start: number }> = []
  let text = ''
  let lastBlock: Element | null = null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text
    const parent = node.parentElement
    if (!node.data || !parent || !parent.checkVisibility()) continue
    // Solo contenido editable: fuera quedan botones, menús y vistas previas de los bloques.
    if (parent.closest('[contenteditable]')?.getAttribute('contenteditable') !== 'true') continue
    const block = parent.closest(BLOCK)
    if (block !== lastBlock) {
      text += '\n'
      lastBlock = block
    }
    nodes.push({ node, start: text.length })
    text += node.data
  }

  const ranges: Range[] = []
  let k = 0
  for (const [from, to] of findInText(text, query)) {
    while (k < nodes.length - 1 && nodes[k + 1].start <= from) k++
    let e = k
    while (e < nodes.length - 1 && nodes[e + 1].start < to) e++
    const range = document.createRange()
    range.setStart(nodes[k].node, from - nodes[k].start)
    range.setEnd(nodes[e].node, to - nodes[e].start)
    ranges.push(range)
  }
  return ranges
}

/** Pinta todas las coincidencias y destaca la actual. */
export function paintRanges(ranges: Range[], current: number): void {
  const reg = CSS.highlights
  if (!reg) return
  reg.set('lumen-find', new Highlight(...ranges))
  if (ranges[current]) reg.set('lumen-find-current', new Highlight(ranges[current]))
  else reg.delete('lumen-find-current')
}

export function clearPaint(): void {
  CSS.highlights?.delete('lumen-find')
  CSS.highlights?.delete('lumen-find-current')
}

/** Desplaza `scroller` para que la coincidencia quede a la vista (a un tercio de la altura). */
export function revealRange(range: Range, scroller: HTMLElement): void {
  const r = range.getBoundingClientRect()
  const box = scroller.getBoundingClientRect()
  if (r.top >= box.top + 40 && r.bottom <= box.bottom - 40) return
  scroller.scrollTop += r.top - box.top - box.height / 3
}
