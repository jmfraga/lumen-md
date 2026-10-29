/**
 * Idiomas de la interfaz. Sin librerías: dos diccionarios planos.
 *
 * - `es` es la fuente: define las claves.
 * - `en` es `Record<MessageKey, string>`: si falta una clave, el typecheck falla.
 * - Variables con `{nombre}`; tests/i18n.test.ts verifica que coincidan entre idiomas.
 * - Inglés: variante americana en todo.
 */

export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']

const es = {
  // App
  'app.untitled': 'Sin título',
  'app.defaultDocName': 'documento',
  'app.docTitleFallback': 'Documento',

  // Menú
  'menu.file': 'Archivo',
  'menu.new': 'Nuevo',
  'menu.open': 'Abrir…',
  'menu.openRecent': 'Abrir reciente',
  'menu.clearRecents': 'Limpiar recientes',
  'menu.noRecents': 'Sin archivos recientes',
  'menu.save': 'Guardar',
  'menu.saveAs': 'Guardar como…',
  'menu.exportHtml': 'Exportar a HTML…',
  'menu.exportPdf': 'Exportar a PDF…',
  'menu.autosave': 'Autoguardado',
  'menu.closeWindow': 'Cerrar ventana',
  'menu.quit': 'Salir',
  'menu.edit': 'Edición',
  'menu.undo': 'Deshacer',
  'menu.redo': 'Rehacer',
  'menu.cut': 'Cortar',
  'menu.copy': 'Copiar',
  'menu.paste': 'Pegar',
  'menu.pasteAndMatchStyle': 'Pegar sin formato',
  'menu.selectAll': 'Seleccionar todo',
  'menu.view': 'Ver',
  'menu.toggleSource': 'Alternar fuente Markdown',
  'menu.resetZoom': 'Tamaño real',
  'menu.zoomIn': 'Acercar',
  'menu.zoomOut': 'Alejar',
  'menu.fullscreen': 'Pantalla completa',
  'menu.devtools': 'Herramientas de desarrollo',
  'menu.window': 'Ventana',
  'menu.minimize': 'Minimizar',
  'menu.zoom': 'Zoom',
  'menu.front': 'Traer todo al frente',
  'menu.help': 'Ayuda',
  'menu.about': 'Acerca de Lumen',
  'menu.services': 'Servicios',
  'menu.hide': 'Ocultar Lumen',
  'menu.hideOthers': 'Ocultar otros',
  'menu.unhide': 'Mostrar todo',
  'menu.quitApp': 'Salir de Lumen',
  'menu.checkUpdates': 'Buscar actualizaciones…',
  'menu.autoCheckUpdates': 'Revisar actualizaciones automáticamente',
  'menu.suggest': '💡 Proponer una mejora…',
  'menu.report': '🐞 Reportar un problema…',
  'menu.community': 'Ver propuestas de la comunidad',
  'menu.github': 'Lumen en GitHub',
  'menu.releaseNotes': 'Novedades de esta versión',

  // Diálogos
  'dialog.unsavedTitle': '¿Guardar los cambios antes de cerrar?',
  'dialog.unsavedDetail': 'Si descartas, los cambios sin guardar se perderán.',
  'dialog.save': 'Guardar',
  'dialog.discard': 'Descartar',
  'dialog.cancel': 'Cancelar',
  'dialog.openError': 'No se pudo abrir el archivo',

  // Barra superior
  'topbar.insert': '+ Insertar',
  'topbar.insertTitle': 'Insertar un bloque (o escribe / en una línea vacía)',
  'topbar.open': 'Abrir',
  'topbar.openTitle': 'Abrir ({shortcut})',
  'topbar.save': 'Guardar',
  'topbar.saveTitle': 'Guardar ({shortcut})',
  'topbar.exportHtmlTitle': 'Exportar a HTML',
  'topbar.exportPdfTitle': 'Exportar a PDF ({shortcut})',
  'topbar.source': 'Fuente',
  'topbar.preview': 'Vista',
  'topbar.toggleTitle': 'Alternar fuente Markdown ({shortcut})',

  // Barra de estado
  'status.newDoc': 'Documento nuevo (sin guardar)',
  'status.word': '{n} palabra',
  'status.words': '{n} palabras',
  'status.modeSource': 'Fuente',
  'status.modeWysiwyg': 'WYSIWYG',
  'status.autosaveTitle': 'Autoguardado',
  'status.autosaveOn': 'Auto ✓',
  'status.unsaved': 'Sin guardar',
  'status.manual': 'Manual',
  'status.suggest': '💡 Sugerir mejora',
  'status.suggestTitle': 'Abre GitHub para proponer una mejora (necesitas una cuenta gratuita)',

  // Mensajes de estado
  'msg.saved': 'Guardado',
  'msg.saveError': 'Error al guardar',
  'msg.exportingPdf': 'Generando PDF…',
  'msg.exportingHtml': 'Generando HTML…',
  'msg.exported': 'Exportado: {path}',
  'msg.error': 'Error: {error}',
  'msg.imageSaved': 'Imagen guardada en {path}',
  'msg.imageNeedsSave':
    'Guarda el documento antes de agregar imágenes: se copian a una carpeta assets/ junto al archivo.',
  'msg.imageError': 'No se pudo guardar la imagen',
  'drop.hint': 'Suelta el archivo Markdown para abrirlo',

  // Bloques (menú Insertar y menú /)
  'insert.h1': 'Título 1',
  'insert.h2': 'Título 2',
  'insert.h3': 'Título 3',
  'insert.h4': 'Título 4',
  'insert.h5': 'Título 5',
  'insert.h6': 'Título 6',
  'insert.paragraph': 'Texto normal',
  'insert.bulletList': 'Lista con viñetas',
  'insert.orderedList': 'Lista numerada',
  'insert.taskList': 'Lista de tareas',
  'insert.quote': 'Cita',
  'insert.divider': 'Separador',
  'insert.table': 'Tabla',
  'insert.tableSize': 'Tabla de {r} filas por {c} columnas',
  'insert.code': 'Bloque de código',
  'insert.mermaid': 'Diagrama Mermaid',
  'insert.math': 'Fórmula LaTeX',
  'insert.image': 'Imagen',
  'slash.text': 'Texto',
  'slash.lists': 'Listas',
  'slash.blocks': 'Bloques',

  // Editor
  'editor.placeholder': 'Escribe aquí…',
  'editor.bold': 'Negritas',
  'editor.italic': 'Cursivas',
  'editor.strikethrough': 'Tachado',
  'editor.inlineCode': 'Código en línea',
  'editor.latex': 'Fórmula LaTeX',
  'editor.link': 'Enlace',
  'editor.mermaidInvalid': 'Diagrama Mermaid inválido',
  'editor.preview': 'Vista previa',
  'editor.chooseFile': 'Elegir archivo…',
  'editor.imagePlaceholder': 'Pega un enlace o elige una imagen',
  'editor.caption': 'Pie de imagen',
  'editor.confirm': 'Aceptar',

  // Asistente de Mermaid
  'wizard.aria': 'Asistente de diagrama Mermaid',
  'wizard.title': 'Diagrama Mermaid',
  'wizard.flowchart': 'Flujo',
  'wizard.sequence': 'Secuencia',
  'wizard.direction': 'Dirección',
  'wizard.dirLR': 'Izquierda → derecha',
  'wizard.dirTD': 'Arriba → abajo',
  'wizard.dirRL': 'Derecha → izquierda',
  'wizard.dirBT': 'Abajo → arriba',
  'wizard.nodes': 'Nodos',
  'wizard.nodeText': 'Texto del nodo',
  'wizard.removeNode': 'Quitar nodo',
  'wizard.addNode': '+ Nodo',
  'wizard.connections': 'Conexiones',
  'wizard.edgeLabel': 'Etiqueta (opcional)',
  'wizard.removeEdge': 'Quitar conexión',
  'wizard.addEdge': '+ Conexión',
  'wizard.participants': 'Participantes',
  'wizard.participantName': 'Nombre',
  'wizard.removeParticipant': 'Quitar participante',
  'wizard.addParticipant': '+ Participante',
  'wizard.messages': 'Mensajes',
  'wizard.messageText': 'Texto del mensaje',
  'wizard.removeMessage': 'Quitar mensaje',
  'wizard.addMessage': '+ Mensaje',
  'wizard.shapeRect': 'Rectángulo',
  'wizard.shapeRound': 'Redondeado',
  'wizard.shapeDiamond': 'Decisión',
  'wizard.shapeCircle': 'Círculo',
  'wizard.edgeArrow': 'Flecha',
  'wizard.edgeDotted': 'Punteada',
  'wizard.edgeThick': 'Gruesa',
  'wizard.edgeLine': 'Línea',
  'wizard.msgSync': 'Mensaje',
  'wizard.msgReply': 'Respuesta',
  'wizard.msgAsync': 'Asíncrono',
  'wizard.msgDotted': 'Punteado',
  'wizard.invalid': 'El diagrama no es válido todavía; revisa las conexiones.',
  'wizard.code': 'Código generado',
  'wizard.hint': 'Después de insertarlo puedes seguir editando el código en el bloque.',
  'wizard.cancel': 'Cancelar',
  'wizard.insert': 'Insertar diagrama',

  // Plantillas de diagrama
  'tpl.start': 'Inicio',
  'tpl.decision': '¿Decisión?',
  'tpl.result': 'Resultado',
  'tpl.yes': 'Sí',
  'tpl.no': 'No',
  'tpl.otherPath': 'Otro camino',
  'tpl.patient': 'Paciente',
  'tpl.doctor': 'Médico',
  'tpl.consult': 'Consulta',
  'tpl.instructions': 'Indicaciones',

  // Actualizaciones
  'update.checking': 'Buscando actualizaciones…',
  'update.upToDate': 'Tienes la versión más reciente de Lumen ({version}).',
  'update.isAvailable': 'está disponible.',
  'update.notes': 'Ver novedades',
  'update.download': 'Descargar',
  'update.goToDownloads': 'Ir a descargas',
  'update.later': 'Más tarde',
  'update.downloading': 'Descargando Lumen {version}… {percent}%',
  'update.isReady': 'está lista para instalarse.',
  'update.restart': 'Reiniciar ahora',
  'update.onQuit': 'Al cerrar Lumen',
  'update.onQuitTitle': 'Se instalará cuando cierres Lumen',
  'update.saveFirst': 'Guarda el documento antes de reiniciar.',
  'update.otherDirty': 'Hay otra ventana con cambios sin guardar.',
  'update.openDownloads': 'Abrir página de descargas',
  'update.close': 'Cerrar',
  'update.errOffline': 'Sin conexión a internet. Se volverá a intentar más tarde.',
  'update.errApplications': 'Mueve Lumen a la carpeta Aplicaciones para poder actualizarla.',
  'update.errGeneric': 'No se pudo revisar o descargar la actualización.'
} as const

export type MessageKey = keyof typeof es

const en: Record<MessageKey, string> = {
  'app.untitled': 'Untitled',
  'app.defaultDocName': 'document',
  'app.docTitleFallback': 'Document',

  'menu.file': 'File',
  'menu.new': 'New',
  'menu.open': 'Open…',
  'menu.openRecent': 'Open Recent',
  'menu.clearRecents': 'Clear Recents',
  'menu.noRecents': 'No Recent Files',
  'menu.save': 'Save',
  'menu.saveAs': 'Save As…',
  'menu.exportHtml': 'Export to HTML…',
  'menu.exportPdf': 'Export to PDF…',
  'menu.autosave': 'Autosave',
  'menu.closeWindow': 'Close Window',
  'menu.quit': 'Quit',
  'menu.edit': 'Edit',
  'menu.undo': 'Undo',
  'menu.redo': 'Redo',
  'menu.cut': 'Cut',
  'menu.copy': 'Copy',
  'menu.paste': 'Paste',
  'menu.pasteAndMatchStyle': 'Paste and Match Style',
  'menu.selectAll': 'Select All',
  'menu.view': 'View',
  'menu.toggleSource': 'Toggle Markdown Source',
  'menu.resetZoom': 'Actual Size',
  'menu.zoomIn': 'Zoom In',
  'menu.zoomOut': 'Zoom Out',
  'menu.fullscreen': 'Toggle Full Screen',
  'menu.devtools': 'Developer Tools',
  'menu.window': 'Window',
  'menu.minimize': 'Minimize',
  'menu.zoom': 'Zoom',
  'menu.front': 'Bring All to Front',
  'menu.help': 'Help',
  'menu.about': 'About Lumen',
  'menu.services': 'Services',
  'menu.hide': 'Hide Lumen',
  'menu.hideOthers': 'Hide Others',
  'menu.unhide': 'Show All',
  'menu.quitApp': 'Quit Lumen',
  'menu.checkUpdates': 'Check for Updates…',
  'menu.autoCheckUpdates': 'Check for Updates Automatically',
  'menu.suggest': '💡 Suggest an Improvement…',
  'menu.report': '🐞 Report a Problem…',
  'menu.community': 'Browse Community Suggestions',
  'menu.github': 'Lumen on GitHub',
  'menu.releaseNotes': "What's New in This Version",

  'dialog.unsavedTitle': 'Save changes before closing?',
  'dialog.unsavedDetail': "If you don't save, your changes will be lost.",
  'dialog.save': 'Save',
  'dialog.discard': "Don't Save",
  'dialog.cancel': 'Cancel',
  'dialog.openError': "Couldn't open the file",

  'topbar.insert': '+ Insert',
  'topbar.insertTitle': 'Insert a block (or type / on an empty line)',
  'topbar.open': 'Open',
  'topbar.openTitle': 'Open ({shortcut})',
  'topbar.save': 'Save',
  'topbar.saveTitle': 'Save ({shortcut})',
  'topbar.exportHtmlTitle': 'Export to HTML',
  'topbar.exportPdfTitle': 'Export to PDF ({shortcut})',
  'topbar.source': 'Source',
  'topbar.preview': 'Preview',
  'topbar.toggleTitle': 'Toggle Markdown source ({shortcut})',

  'status.newDoc': 'New document (not saved)',
  'status.word': '{n} word',
  'status.words': '{n} words',
  'status.modeSource': 'Source',
  'status.modeWysiwyg': 'WYSIWYG',
  'status.autosaveTitle': 'Autosave',
  'status.autosaveOn': 'Auto ✓',
  'status.unsaved': 'Unsaved',
  'status.manual': 'Manual',
  'status.suggest': '💡 Suggest an improvement',
  'status.suggestTitle': 'Opens GitHub to suggest an improvement (requires a free account)',

  'msg.saved': 'Saved',
  'msg.saveError': 'Save failed',
  'msg.exportingPdf': 'Generating PDF…',
  'msg.exportingHtml': 'Generating HTML…',
  'msg.exported': 'Exported: {path}',
  'msg.error': 'Error: {error}',
  'msg.imageSaved': 'Image saved to {path}',
  'msg.imageNeedsSave':
    'Save the document before adding images: they are copied to an assets/ folder next to the file.',
  'msg.imageError': "Couldn't save the image",
  'drop.hint': 'Drop the Markdown file to open it',

  'insert.h1': 'Heading 1',
  'insert.h2': 'Heading 2',
  'insert.h3': 'Heading 3',
  'insert.h4': 'Heading 4',
  'insert.h5': 'Heading 5',
  'insert.h6': 'Heading 6',
  'insert.paragraph': 'Plain text',
  'insert.bulletList': 'Bulleted list',
  'insert.orderedList': 'Numbered list',
  'insert.taskList': 'Task list',
  'insert.quote': 'Quote',
  'insert.divider': 'Divider',
  'insert.table': 'Table',
  'insert.tableSize': 'Table with {r} rows and {c} columns',
  'insert.code': 'Code block',
  'insert.mermaid': 'Mermaid diagram',
  'insert.math': 'LaTeX formula',
  'insert.image': 'Image',
  'slash.text': 'Text',
  'slash.lists': 'Lists',
  'slash.blocks': 'Blocks',

  'editor.placeholder': 'Start writing…',
  'editor.bold': 'Bold',
  'editor.italic': 'Italic',
  'editor.strikethrough': 'Strikethrough',
  'editor.inlineCode': 'Inline code',
  'editor.latex': 'LaTeX formula',
  'editor.link': 'Link',
  'editor.mermaidInvalid': 'Invalid Mermaid diagram',
  'editor.preview': 'Preview',
  'editor.chooseFile': 'Choose file…',
  'editor.imagePlaceholder': 'Paste a link or choose an image',
  'editor.caption': 'Caption',
  'editor.confirm': 'OK',

  'wizard.aria': 'Mermaid diagram assistant',
  'wizard.title': 'Mermaid diagram',
  'wizard.flowchart': 'Flowchart',
  'wizard.sequence': 'Sequence',
  'wizard.direction': 'Direction',
  'wizard.dirLR': 'Left → right',
  'wizard.dirTD': 'Top → bottom',
  'wizard.dirRL': 'Right → left',
  'wizard.dirBT': 'Bottom → top',
  'wizard.nodes': 'Nodes',
  'wizard.nodeText': 'Node text',
  'wizard.removeNode': 'Remove node',
  'wizard.addNode': '+ Node',
  'wizard.connections': 'Connections',
  'wizard.edgeLabel': 'Label (optional)',
  'wizard.removeEdge': 'Remove connection',
  'wizard.addEdge': '+ Connection',
  'wizard.participants': 'Participants',
  'wizard.participantName': 'Name',
  'wizard.removeParticipant': 'Remove participant',
  'wizard.addParticipant': '+ Participant',
  'wizard.messages': 'Messages',
  'wizard.messageText': 'Message text',
  'wizard.removeMessage': 'Remove message',
  'wizard.addMessage': '+ Message',
  'wizard.shapeRect': 'Rectangle',
  'wizard.shapeRound': 'Rounded',
  'wizard.shapeDiamond': 'Decision',
  'wizard.shapeCircle': 'Circle',
  'wizard.edgeArrow': 'Arrow',
  'wizard.edgeDotted': 'Dotted',
  'wizard.edgeThick': 'Thick',
  'wizard.edgeLine': 'Line',
  'wizard.msgSync': 'Message',
  'wizard.msgReply': 'Reply',
  'wizard.msgAsync': 'Async',
  'wizard.msgDotted': 'Dotted',
  'wizard.invalid': "The diagram isn't valid yet; check the connections.",
  'wizard.code': 'Generated code',
  'wizard.hint': 'After inserting it, you can keep editing the code in the block.',
  'wizard.cancel': 'Cancel',
  'wizard.insert': 'Insert diagram',

  'tpl.start': 'Start',
  'tpl.decision': 'Decision?',
  'tpl.result': 'Result',
  'tpl.yes': 'Yes',
  'tpl.no': 'No',
  'tpl.otherPath': 'Other path',
  'tpl.patient': 'Patient',
  'tpl.doctor': 'Doctor',
  'tpl.consult': 'Consultation',
  'tpl.instructions': 'Instructions',

  'update.checking': 'Checking for updates…',
  'update.upToDate': "You're on the latest version of Lumen ({version}).",
  'update.isAvailable': 'is available.',
  'update.notes': "See what's new",
  'update.download': 'Download',
  'update.goToDownloads': 'Go to downloads',
  'update.later': 'Later',
  'update.downloading': 'Downloading Lumen {version}… {percent}%',
  'update.isReady': 'is ready to install.',
  'update.restart': 'Restart now',
  'update.onQuit': 'When I quit',
  'update.onQuitTitle': 'It will install when you quit Lumen',
  'update.saveFirst': 'Save the document before restarting.',
  'update.otherDirty': 'Another window has unsaved changes.',
  'update.openDownloads': 'Open downloads page',
  'update.close': 'Close',
  'update.errOffline': 'No internet connection. Lumen will try again later.',
  'update.errApplications': 'Move Lumen to the Applications folder so it can update.',
  'update.errGeneric': "Couldn't check for or download the update."
}

export const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { es, en }

export type Vars = Record<string, string | number>

/** Mensaje traducible que viaja como dato (estado del documento, errores) y se traduce al mostrarse. */
export interface Message {
  key: MessageKey
  vars?: Vars
}

export function t(lang: Lang, key: MessageKey, vars?: Vars): string {
  const template = DICTIONARIES[lang][key] ?? DICTIONARIES.es[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m
  )
}

export type Translator = (key: MessageKey, vars?: Vars) => string

export function translator(lang: Lang): Translator {
  return (key, vars) => t(lang, key, vars)
}

/** Idioma del sistema → idioma de Lumen. Cualquier variante de español usa español; el resto, inglés. */
export function detectLang(locale: string | null | undefined): Lang {
  return locale && /^es\b|^es[-_]/i.test(locale.trim()) ? 'es' : 'en'
}

export function isLang(v: unknown): v is Lang {
  return v === 'es' || v === 'en'
}

/** Nombre del idioma en su propio idioma, para el selector. */
export const LANG_NAMES: Record<Lang, string> = { es: 'Español', en: 'English' }

/** Tecla modificadora para mostrar atajos: ⌘ en Mac, Ctrl+ en Windows y Linux. */
export function shortcut(platform: string, key: string): string {
  return platform === 'darwin' ? `⌘${key}` : `Ctrl+${key}`
}
