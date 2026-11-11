# Diferencias aceptadas en el round-trip

El test de fidelidad compara el Markdown original con el resultado de
abrir → serializar en Milkdown, normalizando solo:

- espacios al final de línea
- líneas vacías consecutivas (se colapsan a una)
- salto de línea final
- CRLF (Windows) ≡ LF
- en filas de tabla: relleno de espacios alrededor de `|` y largo de los guiones de la fila separadora (`|---|` ≡ `| - |`)

Cualquier otra diferencia es un bug, salvo las listadas aquí con su razón:

- comillas del título de imagen o enlace: `'título'` ≡ `"título"`
- imágenes solas en un párrafo: si la imagen fue redimensionada en Lumen y además tenía texto alternativo, se conserva el texto y se pierde la proporción (Milkdown guarda la proporción en el alt; Lumen prioriza el texto)
- `$` de dinero: si un párrafo, título o celda tiene dos o más `$` que no forman fórmula, Lumen los guarda como `\$` (`MX$2,025 … MX$17,900` → `MX\$2,025 … MX\$17,900`). Obsidian y GitHub podrían leer esos pares como fórmula; con `\$` se ven igual en todos lados. Un `$` solo se guarda tal cual, y un `\$` escrito a mano se conserva cuando hay otro `$` en el bloque.
