# gfuentes.cl — versión nueva

Sitio personal de Guillermo S. Fuentes-Jaque. HTML, CSS y un poco de JavaScript, sin dependencias, sin CDN y sin paso de compilación.

Se publica en paralelo en `https://djwillichile.github.io/gfuentes-web/` (más adelante en `nueva.gfuentes.cl`). Mientras tanto la página lleva `noindex` y un canonical a `https://gfuentes.cl/`.

## Lanzar en gfuentes.cl

1. Quitar `<meta name="robots" content="noindex, follow">` de `index.html`.
2. Agregar un archivo `CNAME` con `gfuentes.cl`.
3. Apuntar el dominio principal a este repositorio en GitHub Pages.

## Sistema visual

Paleta WST Explorer, definida como custom properties `--wst-*` en `styles.css`:

| Uso | Color |
| --- | --- |
| Barra, portada, contacto y texto | navy `#0f2b46` |
| Fondo de página | `#f0f4f8` |
| Superficies | `#ffffff`, bordes `#e5e7eb` |
| Acción principal (CTA) | verde `#2e7d32`, hover `#256b29` |
| Acento sobre fondo oscuro | cian `#4fc3f7` |
| Enlaces | azul `#1976d2` |
| Texto secundario | `#6b7280` (contraste AA sobre blanco) |

Tipografías auto-hospedadas en `assets/fonts` (licencia OFL): **Source Sans 3** para el texto y **JetBrains Mono** para etiquetas y cifras.

## Estructura

| Ruta | Qué contiene |
| --- | --- |
| `index.html` | Todo el contenido en HTML estático, incluido el mapa de trayectoria como SVG |
| `styles.css` | Estilos, tokens `--wst-*` y cortes responsivos (900, 760 y 600 px) |
| `main.js` | Red de nodos de fondo, menú móvil, selector de escena de la portada, trayectoria completa, filtro del histograma de publicaciones, contadores, entradas al hacer scroll y mapa |
| `assets/img` | Imágenes satelitales (NASA, dominio público), miniaturas y capturas de proyectos propios |
| `assets/fonts` | Source Sans 3 y JetBrains Mono |
| `docs/` | Currículum en PDF |

El mapa de trayectoria es un SVG precalculado (Natural Earth 1:50m, proyección Mercator) generado con `d3-geo` fuera del sitio, así que el navegador no carga librerías. JavaScript solo filtra por año los cargos, los estudios y los puntos.

## Créditos de imágenes

Imágenes satelitales de la NASA (Landsat, MODIS y fotografías de la Estación Espacial Internacional), dominio público, vía Wikimedia Commons. Mapa base: Natural Earth. Las capturas de proyectos son obra propia.
