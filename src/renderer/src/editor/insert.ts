import type { Ctx } from '@milkdown/kit/ctx'
import { commandsCtx, editorViewCtx } from '@milkdown/kit/core'
import {
  paragraphSchema,
  headingSchema,
  blockquoteSchema,
  hrSchema,
  bulletListSchema,
  orderedListSchema,
  listItemSchema,
  codeBlockSchema,
  clearTextInCurrentBlockCommand,
  setBlockTypeCommand,
  wrapInBlockTypeCommand,
  addBlockTypeCommand,
  selectTextNearPosCommand
} from '@milkdown/kit/preset/commonmark'
import { createTable } from '@milkdown/kit/preset/gfm'
import { imageBlockSchema } from '@milkdown/kit/component/image-block'

/**
 * Acciones de inserción. Son las mismas que usa el menú `/` de Crepe, expuestas
 * como funciones para que el botón "Insertar" y el menú `/` hagan exactamente lo mismo.
 */

export type InsertKind =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'divider'
  | 'bullet-list'
  | 'ordered-list'
  | 'task-list'
  | 'image'
  | 'code'
  | 'math'
  | 'mermaid'

export const MERMAID_TEMPLATE = `flowchart LR
  A[Inicio] --> B{¿Decisión?}
  B -- Sí --> C[Resultado]
  B -- No --> D[Otro camino]`

function setBlock(
  ctx: Ctx,
  nodeType: ReturnType<typeof headingSchema.type>,
  attrs?: Record<string, unknown>
): void {
  const commands = ctx.get(commandsCtx)
  commands.call(clearTextInCurrentBlockCommand.key)
  commands.call(setBlockTypeCommand.key, { nodeType, attrs })
}

function wrapBlock(
  ctx: Ctx,
  nodeType: ReturnType<typeof headingSchema.type>,
  attrs?: Record<string, unknown>
): void {
  const commands = ctx.get(commandsCtx)
  commands.call(clearTextInCurrentBlockCommand.key)
  commands.call(wrapInBlockTypeCommand.key, { nodeType, attrs })
}

function addBlock(
  ctx: Ctx,
  nodeType: ReturnType<typeof headingSchema.type>,
  attrs?: Record<string, unknown>
): void {
  const commands = ctx.get(commandsCtx)
  commands.call(clearTextInCurrentBlockCommand.key)
  commands.call(addBlockTypeCommand.key, { nodeType, attrs })
}

/** Bloque de código con contenido inicial (para plantillas como Mermaid). */
export function insertCodeBlockWithContent(ctx: Ctx, language: string, content: string): void {
  const view = ctx.get(editorViewCtx)
  const type = codeBlockSchema.type(ctx)
  const node = type.create({ language }, content ? view.state.schema.text(content) : null)
  const tr = view.state.tr.replaceSelectionWith(node)
  view.dispatch(tr.scrollIntoView())
  view.focus()
}

export function insertTable(ctx: Ctx, rows: number, cols: number): void {
  const commands = ctx.get(commandsCtx)
  const view = ctx.get(editorViewCtx)
  commands.call(clearTextInCurrentBlockCommand.key)
  const { from } = view.state.selection
  commands.call(addBlockTypeCommand.key, { nodeType: createTable(ctx, rows, cols) })
  commands.call(selectTextNearPosCommand.key, { pos: from })
  view.focus()
}

export function insert(ctx: Ctx, kind: InsertKind): void {
  switch (kind) {
    case 'paragraph':
      return setBlock(ctx, paragraphSchema.type(ctx))
    case 'h1':
    case 'h2':
    case 'h3':
      return setBlock(ctx, headingSchema.type(ctx), { level: Number(kind[1]) })
    case 'quote':
      return wrapBlock(ctx, blockquoteSchema.type(ctx))
    case 'divider':
      return addBlock(ctx, hrSchema.type(ctx))
    case 'bullet-list':
      return wrapBlock(ctx, bulletListSchema.type(ctx))
    case 'ordered-list':
      return wrapBlock(ctx, orderedListSchema.type(ctx))
    case 'task-list':
      return wrapBlock(ctx, listItemSchema.type(ctx), { checked: false })
    case 'image':
      return addBlock(ctx, imageBlockSchema.type(ctx))
    case 'code':
      return setBlock(ctx, codeBlockSchema.type(ctx))
    case 'math':
      return addBlock(ctx, codeBlockSchema.type(ctx), { language: 'LaTeX' })
    case 'mermaid':
      return insertCodeBlockWithContent(ctx, 'mermaid', MERMAID_TEMPLATE)
  }
}
