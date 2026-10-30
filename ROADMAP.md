# Roadmap

> **Principio:** Lumen es ligero y abre rápido. Cada función nueva debe ganarse su lugar: nada que corra al arrancar si puede esperar, y el presupuesto de tamaño (`npm run size`, también en CI) no se sube sin una razón escrita.

## v0.2 (completada 2026-09-17)

- [x] Botón "Insertar" permanente con menú de bloques en español y selector de tabla
- [x] Imágenes desde archivo y desde el portapapeles, copiadas a `assets/` junto al `.md`
- [x] Asistente visual de diagramas Mermaid (flujo y secuencia) con vista previa

## v0.3 (2026-10-02)

- [x] Actualizaciones: aviso al abrir y cada 24 h, descarga y reinicio a petición del usuario
- [x] Propuestas y reportes por GitHub Issues desde la app, con plantillas en español

## v0.4 (2026-10-29)

- [x] Interfaz en español e inglés, detectada del sistema y con selector en Ver → Idioma · Language
- [x] Atajos con ⌘ en Mac y Ctrl en Windows/Linux en los tooltips
- [x] README y plantillas de propuestas en inglés

## v0.4.1 (2026-10-30) — solo arreglos

Salió de una revisión externa con Codex y Antigravity contra las reglas ligero, rápido y útil.

- [x] Imágenes locales en Windows (`C:\…` y carpetas de red) y nombres con espacios escritos como `%20`
- [x] El aviso al cerrar ya no se pierde si escribes justo mientras se guarda
- [x] Las imágenes pegadas se ven después de "Guardar como" sin reabrir
- [x] PDF de documentos con muchas imágenes (archivo temporal en vez de URL) y sin JavaScript al imprimir
- [x] `Ctrl+W` cierra la ventana en Windows y Linux

## v0.5 (candidatos, medir antes y después)

- Cargar Mermaid y la exportación solo cuando se usan
- Colorear solo los ~10 lenguajes que usa la IA en la vista de código
- Herramienta de capturas solo en desarrollo
- Quitar `<script>` del HTML exportado
- Pruebas de fidelidad más estrictas dentro de celdas y bloques de código

## Después

En orden aproximado de interés:

- Árbol lateral para navegar una carpeta de `.md` y búsqueda entre archivos
- Pestañas dentro de una ventana
- Exportar a Word (`.docx`)
- Preferencias: tipografía, ancho de medida, tema forzado
- Plugins de usuario
