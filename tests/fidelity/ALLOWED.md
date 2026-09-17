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
