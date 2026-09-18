# oasrcode.github.io

Portfolio profesional de **Aythami Santana Rodríguez**, desarrollador Full Stack en
Las Palmas de Gran Canaria, centrado en productos para **emergencias y seguridad
pública** (policía local, CECOPIN), IA, datos en tiempo real y datos oficiales.

Es un sitio estático servido como *user site* de GitHub Pages, por lo que vive en
la raíz del dominio: **https://oasrcode.github.io/**.

## Qué es

Una página de una sola vista (`index.html`) con seis bloques —hero, sobre mí,
experiencia, stack, formación y contacto— construida con contenido de `cv.md`
más detalles adicionales aportados directamente por el autor. Incluye:

- Sistema de temas claro/oscuro con persistencia y respeto por `prefers-color-scheme`.
- Navegación móvil accesible (panel off-canvas, trampa de foco, cierre con Escape,
  bloqueo de scroll y cierre al cruzar a escritorio).
- Scroll-spy con `IntersectionObserver` y animaciones de aparición de un solo uso.
- Contacto solo con enlaces (LinkedIn, GitHub): **no hay formulario**.
- Metadatos SEO completos (Open Graph, Twitter Card, JSON-LD `Person`).
- Tipografías self-hosted, sin peticiones a terceros.

## Qué no es (decisiones deliberadas)

- **Sin frameworks.** Nada de React, Vue, Angular ni similares; HTML, CSS y
  JavaScript vanilla.
- **Sin build step.** No hay bundler, transpilador ni pipeline de assets: los
  archivos del repositorio son exactamente lo que sirve el navegador.
- **Sin dependencias de runtime ni peticiones a terceros.** Tras eliminar Google
  Fonts, la página no contacta con ningún dominio externo: solo carga recursos del
  propio origen. Playwright y Lighthouse son **devDependencies** para pruebas.
- **No hay sección de proyectos** ni formulario de contacto (eliminados a propósito).

## Stack

- **HTML, CSS y JavaScript vanilla** (módulos ES). Sin frameworks y sin build step.
- **Tipografías self-hosted** en `assets/fonts/` (ver más abajo). Única dependencia
  en runtime, y es local.

## Tipografías

Las tres familias son **variable fonts** en formato `.woff2`, servidas desde el
propio dominio. Solo se incluyen los subconjuntos `latin` y `latin-ext` (el texto
en español queda cubierto por `latin`; `latin-ext` se declara para no caer a la
fuente del sistema si algún día se usa un glifo de ese rango). No hay pesos ni
subconjuntos sin usar.

| Familia | Uso | Eje de peso | Archivos |
| --- | --- | --- | --- |
| Space Grotesk | Títulos y display | 300–700 | `space-grotesk-latin-wght-normal.woff2`, `space-grotesk-latin-ext-wght-normal.woff2` |
| Inter | Texto de cuerpo | 100–900 | `inter-latin-wght-normal.woff2`, `inter-latin-ext-wght-normal.woff2` |
| JetBrains Mono | Etiquetas, fechas y chips | 100–800 | `jetbrains-mono-latin-wght-normal.woff2`, `jetbrains-mono-latin-ext-wght-normal.woff2` |

- Las reglas `@font-face` están en `assets/css/fonts.css`, que se carga **primero**
  en la cascada (`fonts → tokens → base → components → sections`).
- Licencia: **SIL Open Font License 1.1**. Los tres proyectos son OFL y permiten
  el self-hosting. El texto completo de la licencia y la procedencia de cada
  archivo están en `assets/fonts/OFL.txt`.
- Los `.woff2` se copiaron de los paquetes npm `@fontsource-variable/*` v5.3.0
  (que reempaquetan las versiones de Google Fonts). El resultado está *vendorizado*
  en el repositorio: no hay dependencia en runtime.

### Estrategia anti *layout shift* (`font-display: optional`)

La carga usa **`font-display: optional`**, no `swap`. El motivo es concreto: con
un fragmento (`#seccion`) y un header sticky, un *swap* tardío de la fuente
encoge la página y puede dejar la sección enlazada por debajo del header. En
navegadores con *scroll anchoring* (Chromium) el salto queda enmascarado, pero en
motores sin él (Safari) y sin JavaScript, la página no puede re-anclarse.

`optional` elimina el *swap* de raíz: o la fuente está lista dentro del bloqueo
inicial (~100 ms) y se usa, o se pinta el *fallback* del sistema y **no se
sustituye** después. Así el layout no cambia tras el primer render y el anclaje es
estable sin JavaScript.

**Contrapartida aceptada:** en una primera visita con conexión lenta el navegador
puede mostrar la fuente del sistema; en visitas posteriores (fuente en caché) se
usa la webfont. A cambio, el *layout* es determinista y no hay desplazamiento.

> Se podría haber elegido `swap` con un *fallback* de métricas ajustadas
> (`size-adjust`, `ascent-override`…). Se descartó porque todas las alturas de
> línea del sitio son números sin unidad (las cajas de línea ya no dependen de las
> métricas) y el desplazamiento real viene del **reflow por anchura de glifos**
> (saltos de línea y `flex-wrap` de los chips), que los overrides no pueden
> garantizar.

## Estructura de archivos

```
.
├── index.html                 # Página completa (una sola vista)
├── robots.txt                 # Directivas para crawlers + sitemap
├── sitemap.xml                # Sitemap con la URL raíz
├── favicon.ico                # Fallback raíz (generado desde el SVG)
├── assets/
│   ├── fonts/                 # Webfonts self-hosted (woff2) + OFL.txt
│   ├── css/
│   │   ├── fonts.css          # @font-face (self-hosted, font-display: optional)
│   │   ├── tokens.css         # Reset, design tokens y temas
│   │   ├── base.css           # Tipografía, layout y utilidades
│   │   ├── components.css     # Componentes reutilizables
│   │   └── sections.css       # Regiones de la página y secciones
│   ├── js/
│   │   ├── main.js            # Punto de entrada
│   │   ├── nav.js             # Menú móvil, foco y scroll-spy
│   │   ├── reveal.js          # Animaciones de aparición
│   │   └── theme.js           # Sistema de temas
│   ├── icons/
│   │   ├── favicon.svg        # Favicon vectorial (monograma)
│   │   └── apple-touch-icon.png
│   └── og-image.png           # Imagen Open Graph / Twitter (1200×630)
├── tests/                     # Suite de Playwright
└── playwright.config.js
```

> **Nota:** el `cv.md` del autor **no forma parte del repositorio**. Es la fuente
> del contenido de la página, pero se mantiene fuera de él y se actualiza por
> separado, de modo que no se publica en GitHub Pages.

## Cómo ejecutarlo en local

No necesita build. Sirve la carpeta raíz con cualquier servidor estático:

```bash
python3 -m http.server 8080
```

Y abre <http://localhost:8080/>.

## Cómo ejecutar los tests

```bash
npx playwright test
```

En una máquina nueva instala primero las dependencias y el navegador de Playwright:

```bash
npm install
npx playwright install chromium
```

La suite arranca su propio servidor (`python3 -m http.server 8080 --bind 127.0.0.1`)
según `playwright.config.js`, así que no hace falta levantarlo a mano.

## Cómo lo sirve GitHub Pages

El repositorio se llama `oasrcode.github.io`, por lo que GitHub Pages lo publica
como **user site** en la raíz del dominio. Basta con tener Pages configurado para
servir la **raíz de la rama `main`** (Settings → Pages → Deploy from a branch →
`main` / `/root`). No hay workflow de despliegue ni artefacto que subir: el
contenido de la rama es el sitio.

- HTTPS: activo por defecto en GitHub Pages (marca *Enforce HTTPS* si no lo está).
- URLs relevantes:
  - Web: https://oasrcode.github.io/
  - `robots.txt`: https://oasrcode.github.io/robots.txt
  - `sitemap.xml`: https://oasrcode.github.io/sitemap.xml
- **Dominio propio:** si algún día se añade uno, hay que crear un `CNAME` en la
  raíz y actualizar `canonical`, Open Graph, Twitter Card, JSON-LD, `sitemap.xml`
  y `robots.txt` con el nuevo host.

## Pendientes antes de publicar

No quedan *placeholders* ni `TODO(oasr)` en `index.html`: los enlaces de
contacto apuntan ya a los perfiles reales de LinkedIn y GitHub.

No hay formulario, Formspree ni Web3Forms: el contacto es exclusivamente por
enlaces.

## Accesibilidad y rendimiento

- **Contraste AA** en ambos temas (mínimo medido: 6.16:1 en claro y 5.55:1 en
  oscuro, por encima del 4.5:1 exigido para texto normal).
- Temas claro/oscuro con persistencia y anti-FOUC; el icono del toggle se
  controla por CSS desde `data-theme`.
- Navegación por teclado completa, `:focus-visible`, `prefers-reduced-motion`
  respetado y contenido visible sin JavaScript.
- Sin desbordamiento horizontal de 320px a 1440px; sin errores de consola ni
  peticiones fallidas.
- **Lighthouse móvil:** Performance **98**, Accessibility **100**, Best Practices
  **100**, SEO **100** (CLS 0, sin peticiones a terceros).
