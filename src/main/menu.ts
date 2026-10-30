import { app, BrowserWindow, Menu, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { basename } from 'path'
import { createWindow, refreshTitles } from './windows'
import { openPathInWindow, openFileDialog } from './ipc'
import { clearRecents, getPreferences, getRecents, setPreferences } from './store'
import { checkForUpdates, openFeedback } from './updater'
import { IPC } from '../shared/ipc'
import { LANGS, LANG_NAMES, translator, type Lang } from '../shared/i18n'

const isMac = process.platform === 'darwin'
const REPO = 'https://github.com/jmfraga/lumen-md'
/** Bilingüe a propósito: quien no entiende el idioma activo igual lo encuentra. */
const LANGUAGE_MENU_LABEL = 'Idioma · Language'

function send(command: string): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IPC.command, command)
}

/** Cambia el idioma de toda la app al instante: menú, títulos de ventana y cada ventana abierta. */
export function setLanguage(lang: Lang): void {
  setPreferences({ language: lang })
  rebuildMenu()
  refreshTitles()
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.language, lang)
  }
}

export function buildMenu(): Menu {
  const recents = getRecents()
  const prefs = getPreferences()
  const t = translator(prefs.language)

  const recentItems: MenuItemConstructorOptions[] = recents.length
    ? [
        ...recents.map((p) => ({
          label: basename(p),
          sublabel: p,
          click: () => openPathInWindow(p, BrowserWindow.getFocusedWindow())
        })),
        { type: 'separator' as const },
        {
          label: t('menu.clearRecents'),
          click: () => {
            clearRecents()
            rebuildMenu()
          }
        }
      ]
    : [{ label: t('menu.noRecents'), enabled: false }]

  const languageItems: MenuItemConstructorOptions[] = LANGS.map((lang) => ({
    label: LANG_NAMES[lang],
    type: 'radio' as const,
    checked: prefs.language === lang,
    click: () => setLanguage(lang)
  }))

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const, label: t('menu.about') },
              { label: t('menu.checkUpdates'), click: () => void checkForUpdates(true) },
              { type: 'separator' as const },
              { role: 'services' as const, label: t('menu.services') },
              { type: 'separator' as const },
              { role: 'hide' as const, label: t('menu.hide') },
              { role: 'hideOthers' as const, label: t('menu.hideOthers') },
              { role: 'unhide' as const, label: t('menu.unhide') },
              { type: 'separator' as const },
              { role: 'quit' as const, label: t('menu.quitApp') }
            ]
          }
        ]
      : []),
    {
      label: t('menu.file'),
      submenu: [
        { label: t('menu.new'), accelerator: 'CmdOrCtrl+N', click: () => createWindow(null) },
        {
          label: t('menu.open'),
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog(BrowserWindow.getFocusedWindow() ?? undefined)
        },
        { label: t('menu.openRecent'), submenu: recentItems },
        { type: 'separator' },
        { label: t('menu.save'), accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        {
          label: t('menu.saveAs'),
          accelerator: 'Shift+CmdOrCtrl+S',
          click: () => send('save-as')
        },
        { type: 'separator' },
        { label: t('menu.exportHtml'), click: () => send('export-html') },
        {
          label: t('menu.exportPdf'),
          accelerator: 'CmdOrCtrl+P',
          click: () => send('export-pdf')
        },
        { type: 'separator' },
        {
          label: t('menu.autosave'),
          type: 'checkbox',
          checked: prefs.autosave,
          click: () => send('toggle-autosave')
        },
        { type: 'separator' },
        { role: 'close', label: t('menu.closeWindow') },
        ...(isMac ? [] : [{ role: 'quit' as const, label: t('menu.quit') }])
      ]
    },
    {
      label: t('menu.edit'),
      submenu: [
        { role: 'undo', label: t('menu.undo') },
        { role: 'redo', label: t('menu.redo') },
        { type: 'separator' },
        { role: 'cut', label: t('menu.cut') },
        { role: 'copy', label: t('menu.copy') },
        { role: 'paste', label: t('menu.paste') },
        { role: 'pasteAndMatchStyle', label: t('menu.pasteAndMatchStyle') },
        { role: 'selectAll', label: t('menu.selectAll') }
      ]
    },
    {
      label: t('menu.view'),
      submenu: [
        {
          label: t('menu.toggleSource'),
          accelerator: 'CmdOrCtrl+/',
          click: () => send('toggle-source')
        },
        { type: 'separator' },
        { label: LANGUAGE_MENU_LABEL, submenu: languageItems },
        { type: 'separator' },
        { role: 'resetZoom', label: t('menu.resetZoom') },
        { role: 'zoomIn', label: t('menu.zoomIn') },
        { role: 'zoomOut', label: t('menu.zoomOut') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t('menu.fullscreen') },
        ...(app.isPackaged
          ? []
          : [
              { type: 'separator' as const },
              { role: 'toggleDevTools' as const, label: t('menu.devtools') }
            ])
      ]
    },
    {
      label: t('menu.window'),
      submenu: [
        { role: 'minimize', label: t('menu.minimize') },
        { role: 'zoom', label: t('menu.zoom') },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const, label: t('menu.front') }]
          : [])
      ]
    },
    {
      role: 'help',
      label: t('menu.help'),
      submenu: [
        { label: t('menu.suggest'), click: () => openFeedback('mejora') },
        { label: t('menu.report'), click: () => openFeedback('problema') },
        { label: t('menu.community'), click: () => shell.openExternal(`${REPO}/issues`) },
        { type: 'separator' as const },
        ...(isMac
          ? []
          : [{ label: t('menu.checkUpdates'), click: () => void checkForUpdates(true) }]),
        {
          label: t('menu.autoCheckUpdates'),
          type: 'checkbox' as const,
          checked: prefs.checkUpdates,
          click: () => {
            setPreferences({ checkUpdates: !getPreferences().checkUpdates })
            rebuildMenu()
          }
        },
        { type: 'separator' as const },
        { label: t('menu.github'), click: () => shell.openExternal(REPO) },
        {
          label: t('menu.releaseNotes'),
          click: () => shell.openExternal(`${REPO}/releases/tag/v${app.getVersion()}`)
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

export function rebuildMenu(): void {
  Menu.setApplicationMenu(buildMenu())
}
