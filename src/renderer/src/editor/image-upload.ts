import type { Ctx } from '@milkdown/kit/ctx'
import { commandsCtx } from '@milkdown/kit/core'
import { addBlockTypeCommand } from '@milkdown/kit/preset/commonmark'
import { imageBlockSchema } from '@milkdown/kit/component/image-block'

/**
 * Imágenes: se copian a `assets/` junto al .md y el Markdown queda con ruta
 * relativa, así el documento sigue siendo portátil. Requiere que el documento
 * ya tenga ruta (un documento nuevo no tiene "junto a").
 */

export class DocumentNotSavedError extends Error {
  constructor() {
    super(
      'Guarda el documento antes de agregar imágenes: se copian a una carpeta assets/ junto al archivo.'
    )
    this.name = 'DocumentNotSavedError'
  }
}

export async function saveImageAsset(file: File, docPath: string | null): Promise<string> {
  if (!docPath) throw new DocumentNotSavedError()
  const data = await file.arrayBuffer()
  const name = file.name && file.name !== 'image.png' ? file.name : null
  const res = await window.lumen.saveAsset(docPath, name, file.type || 'image/png', data)
  if (!res.ok || !res.relPath) throw new Error(res.error ?? 'No se pudo guardar la imagen')
  return res.relPath
}

export function imageFilesFromClipboard(dt: DataTransfer | null): File[] {
  if (!dt) return []
  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'))
}

export function insertImageBlock(ctx: Ctx, src: string, alt = ''): void {
  const commands = ctx.get(commandsCtx)
  commands.call(addBlockTypeCommand.key, {
    nodeType: imageBlockSchema.type(ctx),
    attrs: { src, alt }
  })
}
