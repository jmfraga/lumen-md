# Diferencias aceptadas en el round-trip

El test de fidelidad compara el Markdown original con el resultado de
abrir → serializar en Milkdown, normalizando solo:

- espacios al final de línea
- líneas vacías consecutivas (se colapsan a una)
- salto de línea final
- CRLF (Windows) ≡ LF
- en filas de tabla: relleno de espacios alrededor de `|` y largo de los guiones de la fila separadora (`|---|` ≡ `| - |`)

Cualquier otra diferencia es un bug, salvo las listadas aquí con su razón:

(ninguna todavía)
