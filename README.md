# Lumen

Lector y editor Markdown WYSIWYG, libre y multiplataforma (macOS, Windows, Linux).
Pensado para revisar con comodidad los documentos `.md` que generan las herramientas de IA:
tablas que no se rompen, código con colores, diagramas Mermaid, fórmulas LaTeX y frontmatter YAML.

## Qué hace

- **WYSIWYG** con [Milkdown](https://milkdown.dev): escribes y ves el resultado; las tablas se editan como tablas.
- **Vista de fuente** (`Cmd/Ctrl+/`) con CodeMirror para ver y corregir el Markdown crudo.
- **Tablas GFM, listas de tareas, código con resaltado, Mermaid, KaTeX, frontmatter YAML** (se conserva intacto al guardar).
- **Botón "Insertar"** (o `/` en una línea vacía) para crear títulos, listas, tablas con selector de filas y columnas, código, diagramas Mermaid, fórmulas e imágenes sin saber Markdown.
- **Imágenes**: pega una del portapapeles o elígela desde el bloque de imagen; Lumen la copia a `assets/` junto al `.md` y deja la ruta relativa, así el documento sigue siendo portátil.
- **Doble clic** sobre un `.md` lo abre; una ventana por documento; arrastrar y soltar; recientes.
- **Autoguardado** (se puede apagar en el menú Archivo).
- **Exportar a HTML** autocontenido y **a PDF**.
- Tema claro/oscuro siguiendo el sistema.

## Instalar

Descarga el instalador de tu plataforma desde [Releases](https://github.com/jmfraga/lumen-md/releases):

- macOS: `Lumen-x.y.z.dmg` (universal, firmado y notarizado)
- Windows: `lumen-md-x.y.z-setup.exe`
- Linux: `Lumen-x.y.z.AppImage` o `.deb`

## Desarrollo

```bash
npm install
npm run dev        # app con recarga en caliente
npm test           # vitest: fidelidad del round-trip + unitarias
npm run typecheck
npm run build:mac  # o build:win / build:linux
```

Requiere Node 22+.

### Fidelidad del Markdown

`tests/fidelity/corpus/` contiene documentos representativos. Cada uno pasa por
abrir → serializar y debe volver idéntico salvo normalizaciones triviales.
Las diferencias aceptadas se documentan en `tests/fidelity/ALLOWED.md`.
Si tienes un `.md` que Lumen altera al guardar, agrégalo al corpus en un PR.

### Firma y notarización (macOS)

El workflow de release firma y notariza **solo si** existen estos secretos en GitHub
(Settings → Secrets → Actions). Nunca van en el repo.

| Secreto                       | Contenido                                                              |
| ----------------------------- | ---------------------------------------------------------------------- |
| `CSC_LINK`                    | Certificado _Developer ID Application_ en `.p12`, codificado en base64 |
| `CSC_KEY_PASSWORD`            | Contraseña del `.p12`                                                  |
| `APPLE_ID`                    | Apple ID de la cuenta de desarrollador                                 |
| `APPLE_APP_SPECIFIC_PASSWORD` | Contraseña específica de app (appleid.apple.com)                       |
| `APPLE_TEAM_ID`               | Team ID (10 caracteres)                                                |

Sin ellos, el build de macOS sale sin firmar: la primera vez se abre con clic derecho → Abrir.

### Publicar una versión

```bash
npm version patch   # o minor / major
git push --follow-tags
```

El tag `v*` dispara `release.yml`, que construye las tres plataformas y publica el Release.

## Licencia

MIT. Ver [LICENSE](LICENSE).
