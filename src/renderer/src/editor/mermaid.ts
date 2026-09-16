import mermaid from 'mermaid'

let initialized = false
let counter = 0

function ensureInit(dark: boolean): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    securityLevel: 'strict'
  })
  initialized = true
}

export function isDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Renderiza un diagrama a SVG. Devuelve null si el código no es válido. */
export async function renderMermaid(code: string, dark = isDark()): Promise<string | null> {
  if (!initialized) ensureInit(dark)
  try {
    const { svg } = await mermaid.render(`lumen-mermaid-${++counter}`, code)
    return svg
  } catch {
    return null
  }
}

export function resetMermaidTheme(): void {
  ensureInit(isDark())
}
