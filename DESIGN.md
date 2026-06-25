---
name: Forge
description: Sistema operativo arquitectónico para backend — landing page de marca
colors:
  dark: "#050505"
  black: "#000000"
  white: "#ffffff"
  accent: "#e7ffa5"
  light: "#eeeeee"
  accent-subtle: "rgba(231, 255, 165, 0.1)"
  accent-border: "rgba(231, 255, 165, 0.15)"
  accent-border-hover: "rgba(231, 255, 165, 0.5)"
  accent-muted: "rgba(231, 255, 165, 0.3)"
  selection-bg: "rgba(231, 255, 165, 0.3)"
  error-red: "rgba(220, 38, 38, 0.2)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 5vw + 1rem, 4rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 2vw + 0.75rem, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  subheading:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.125rem, 1vw + 0.75rem, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
  code:
    fontFamily: "ui-monospace, SF Mono, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "20px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
components:
  button-primary:
    backgroundColor: "#e7ffa5"
    textColor: "#050505"
    rounded: "12px"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "#e7ffa5"
    textColor: "#050505"
    transform: "scale(1.05)"
  button-ghost:
    backgroundColor: "#000000"
    textColor: "#ffffff"
    border: "1px solid rgba(231, 255, 165, 0.3)"
    rounded: "12px"
    padding: "12px 20px"
    minHeight: "44px"
  button-ghost-hover:
    border: "1px solid rgba(231, 255, 165, 0.5)"
    transform: "scale(1.05)"
  nav-link:
    textColor: "#eeeeee"
    opacity: 0.8
  nav-link-hover:
    textColor: "#eeeeee"
    opacity: 1
  card-dark:
    backgroundColor: "#000000"
    border: "1px solid rgba(231, 255, 165, 0.15)"
    rounded: "16px"
  card-dark-hover:
    border: "1px solid rgba(231, 255, 165, 0.5)"
  badge-subtle:
    backgroundColor: "rgba(231, 255, 165, 0.1)"
    border: "1px solid rgba(231, 255, 165, 0.3)"
    rounded: "9999px"
  input-focus:
    outlineColor: "#e7ffa5"
    outlineOffset: "2px"
---

# Design System: Forge

## 1. Overview

**Creative North Star: "La Sala de Control Industrial"**

Forge es una landing page de marca técnica y precisa para una herramienta CLI de arquitectura backend. El sistema visual toma prestado el vocabulario de los tableros de control industrial: fondos oscuros tipo Nixie Tube, acentos amarillo brillante de alta visibilidad (como señalización de seguridad), tipografía sans-serif sin adornos, y bordes sutiles que delimitan zonas como paneles de control. La sensación es de instrumento de precisión, no de marketing SaaS genérico. Cada decisión rechaza el brillo startup: sin gradientes, sin glassmorphism, sin esquinas excesivamente redondeadas.

**Key Characteristics:**
- Sistema de dos superficies: Dark (#050505) como fondo principal, Negro (#000000) como superficie elevada
- Acento amarillo brillante (#e7ffa5) usado con restraint — nunca supera el 15% del viewport
- Bordes semitransparentes en lugar de sombras para definir elevación
- Animaciones framer-motion sutiles: entradas con fade + slide, hover con scale, sin rebotes
- Sin serifas — la personalidad es técnica y directa, no editorial

## 2. Colors: The Industrial Control Palette

El sistema usa dos superficies (fondo y elevación) y un acento de precisión.

### Primary
- **Dark** (#050505): Fondo dominante de la página. Color de base sobre el que operan todas las capas.
- **Amarillo Señalización** (#e7ffa5): Acento único. Usado en CTAs principales, badges activos, valores destacados (stats), y elementos de atención. Nunca supera el 10-15% de cualquier viewport dado.

### Neutral
- **Negro** (#000000): Superficie de elevación. Cards, nav scrolleada, código en el hero. Reemplaza sombras como mecanismo de profundidad.
- **Blanco** (#ffffff): Texto sobre fondos oscuros. Títulos, labels, texto primario en sections con fondo negro.
- **Light** (#eeeeee): Color de texto secundario sobre fondos oscuros. Texto de cuerpo, labels, descripciones.

### Named Rules
**The Accent Rarity Rule.** El amarillo (#e7ffa5) aparece en ≤10% de cualquier pantalla. Su escasez es el punto — si todo es urgente, nada lo es. Solo CTAs, valores numéricos destacados, y badges de estado reciben este color.

**The Two-Surface Rule.** El sistema tiene exactamente dos superficies: Dark (base) y Negro (elevada). No hay tercera superficie. Si necesitas más contraste, usa opacidades del amarillo, no nuevos fondos.

## 3. Typography

**Display Font:** Geist Pixel Square (self-hosted via `public/fonts/GeistPixel-Square.woff2`)
**Body Font:** Geist Mono (self-hosted via `public/fonts/GeistMono-Variable.woff2`)
**Mono Font:** Geist Mono (mismo que body)

**Character:** Geist Pixel Square para títulos — fuente display pixelada con carácter técnico. Geist Mono para cuerpo de texto — monospace preciso y legible. Contraste deliberado entre pixel display y mono regular creando jerarquía sin esfuerzo. Variable wght 100-900 para Geist Mono, peso fijo 400 para Pixel Square.

### Hierarchy
- **Display** (700, clamp(2.5rem, 5vw + 1rem, 4rem), 1.1): Headline principal del Hero. Geist Pixel Square. Letter-spacing -0.02em. Color blanco sobre Dark.
- **Heading** (700, clamp(1.75rem, 2vw + 0.75rem, 2.25rem), 1.2): Títulos de sección. Geist Pixel Square. Color blanco.
- **Subheading** (400, clamp(1.125rem, 1vw + 0.75rem, 1.25rem), 1.4): Subtítulos de sección. Geist Mono. Color light con 80% opacidad.
- **Body** (400, 1rem, 1.7, max-width 65ch): Texto de descripción. Geist Mono. Color light con 80% opacidad para cumplir WCAG AA. Max-width 65ch para legibilidad.
- **Caption** (400, 0.875rem, 1.5): Labels secundarios, metadata. Geist Mono. Color light con 80% opacidad.
- **Label/Mono** (400, 0.875rem, 1.6): Código, badges técnicos (R1-R9, CRITICAL/ERROR/WARNING). Geist Mono.

### Named Rules
**The No-Decoration Rule.** Sin sombras de texto, sin text-gradient, sin letter-spacing expandido para "aire". Solo peso y tamaño comunican jerarquía.

## 4. Elevation

El sistema es **flat-by-default**. No hay sombras en estado de reposo. La profundidad se comunica por:
1. **Superficie**: Negro (#000000) sobre Dark (#050505) — cambio de color, no sombra.
2. **Bordes semitransparentes**: `rgba(231, 255, 165, 0.15)` para delimitar cards y contenedores elevados.
3. **Scroll backdrop blur**: Solo la nav scrolleada usa `backdrop-filter: blur(12px)` para crear efecto de glass sobre el contenido.

### Named Rules
**The Flat-By-Default Rule.** Las superficies son planas en reposo. Sombras nulas. Si un elemento necesita separarse, cambia a superficie Negra o añade borde amarillo. Las sombras solo aparecen como respuesta a estado hover/elevation.

## 5. Components

### Buttons
- **Shape:** Esquinas redondeadas (12px / rounded-xl) — ni fully rounded (circles) ni flat (0px). Moderación geométrica.
- **Primary (CTA):** Fondo #e7ffa5, texto #050505, padding 16px 32px, font-weight semibold (600). Hover: scale(1.05) vía framer-motion. Nunca lleva borde.
- **Ghost (Secundario):** Fondo #000000, texto #ffffff, borde `rgba(231, 255, 165, 0.3)` de 1px. Hover: borde sube a `rgba(231, 255, 165, 0.5)`, scale(1.05).
- **Focus:** `outline: 2px solid #e7ffa5; outline-offset: 2px` — visible en navegación, links, y cualquier elemento interactivo.

### Cards / Containers
- **Corner Style:** 16px (rounded-2xl) en cards oscuras, 12px (rounded-xl) en elementos internos.
- **Background:** Negro (#000000) — la única superficie elevada.
- **Border:** 1px solid rgba(231, 255, 165, 0.15). Hover: rgba(231, 255, 165, 0.5) con transición.
- **Internal Padding:** 24px–32px (gap-6 → p-8).
- **Shadow Strategy:** Nula. La card se eleva por contraste de superficie, no por sombra.

### Navigation
- **Default state:** Transparente, sin borde. Logo Forge + links + CTA GitHub.
- **Scrolled state:** Fondo `rgba(5, 5, 5, 0.95)` con `backdrop-filter: blur(12px)` + borde inferior `rgba(231, 255, 165, 0.1)`.
- **Links:** Color #eeeeee al 80% opacidad. Hover: 100% opacidad, sin cambio de color.
- **CTA button:** Primary style — fondo #e7ffa5, texto #050505, rounded-lg (8px), padding px-4 py-2.
- **Mobile:** Menú hamburguesa con animación AnimatePresence para slide + fade del panel.

### Badges / Tags
- **Badge sutil:** Fondo `rgba(231, 255, 165, 0.1)`, borde `rgba(231, 255, 165, 0.3)`, texto #e7ffa5, fully rounded (9999px). Ejemplo: badge "Backend Architecture OS" en el Hero.
- **Badge de severidad:** Fondo `rgba(220, 38, 38, 0.2)`, texto #e7ffa5. Usado para ERROR/CRITICAL labels.

### Stats Cards
- **Layout:** Grid 2×2 en mobile, 4 columnas en desktop.
- **Estilo:** Fondo Negro, borde `rgba(231, 255, 165, 0.2)`, texto del valor en #e7ffa5 (tamaño 4xl–5xl), label en blanco, descripción en light 80%.

### Inputs / Focus States
- **Focus visible global:** `outline: 2px solid #e7ffa5; outline-offset: 2px` en `*:focus-visible`. Aplica a todo elemento interactivo.

## 6. Do's and Don'ts

### Do:
- **Do** usa Negro (#000000) como superficie de elevación sobre Dark. Esta combinación es el fundamento del sistema.
- **Do** limita el amarillo (#e7ffa5) a CTAs, valores numéricos destacados, y badges de estado. Menos es más.
- **Do** usa bordes semitransparentes amarillo (`rgba(231, 255, 165, 0.15)`) para delimitar cards y paneles elevados.
- **Do** aplica `backdrop-filter: blur(12px)` solo a la navegación scrolleada, nunca a cards ni modales.
- **Do** usa framer-motion para transiciones de estado (hover scale, fade-in de entrada) — nunca para efectos decorativos pesados.
- **Do** usa la escala clamp() para fluid typography en display y headings.
- **Do** respeta max-width 65ch en texto de cuerpo para legibilidad óptima.

### Don't:
- **Don't** uses gradientes de fondo. El fondo es Dark sólido o Negro sólido, nunca gradientes.
- **Don't** uses glassmorphism (backdrop-blur + transparencia) en cards o secciones — solo en la nav scrolleada.
- **Don't** uses sombras de box para elevación. El sistema es flat — superficie + borde, no sombra.
- **Don't** usa más de dos superficies (Dark + Negro). No inventes terceros fondos.
- **Don't** usa el amarillo como color de texto de párrafo — solo para valores destacados, badges, y CTAs.
- **Don't** usa bordes redondeados menores de 8px en cards. Demasiado sharp confunde; demasiado rounded diluye la precisión técnica.
- **Don't** animas elementos con bounce o overshoot exagerado. La personalidad es controlada, no energética.