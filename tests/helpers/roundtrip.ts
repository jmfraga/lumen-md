import { Crepe } from '@milkdown/crepe'
import { frontmatter } from '../../src/renderer/src/editor/frontmatter'
import {
  configureSerialization,
  postProcessMarkdown
} from '../../src/renderer/src/editor/serialization'

/**
 * El mismo editor que usa la app (Crepe con todas sus features y nuestro
 * frontmatter), montado en jsdom, sin interfaz visible. parse → serialize.
 */
export async function roundTrip(markdown: string): Promise<string> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const crepe = new Crepe({ root, defaultValue: markdown })
  crepe.editor.use(frontmatter)
  configureSerialization(crepe.editor)
  await crepe.create()
  try {
    return postProcessMarkdown(crepe.getMarkdown())
  } finally {
    await crepe.destroy()
    root.remove()
  }
}
