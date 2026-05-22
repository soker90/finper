---
name: Finper Design System
colors:
  primary: "#1890ff"
  secondary: "#8c8c8c"
  success: "#52c41a"
  warning: "#faad14"
  error: "#ff4d4f"
  info: "#13c2c2"
  background:
    paper: "#ffffff"
    default: "#fafafa"
    divider: "#f0f0f0"
typography:
  fontFamily: "'Public Sans', sans-serif"
  h1:
    fontSize: "2.375rem"
    fontWeight: "600"
  h2:
    fontSize: "1.875rem"
    fontWeight: "600"
  h3:
    fontSize: "1.5rem"
    fontWeight: "600"
  h4:
    fontSize: "1.25rem"
    fontWeight: "600"
  h5:
    fontSize: "1.00rem"
    fontWeight: "600"
  h6:
    fontSize: "0.875rem"
    fontWeight: "400"
  subtitle1:
    fontSize: "0.875rem"
    fontWeight: "600"
  subtitle2:
    fontSize: "0.75rem"
    fontWeight: "500"
  body1:
    fontSize: "0.875rem"
    fontWeight: "400"
  body2:
    fontSize: "0.75rem"
    fontWeight: "400"
  caption:
    fontSize: "0.75rem"
    fontWeight: "400"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
shapes:
  borderRadius: "8px"
  cardRadius: "8px"
  buttonRadius: "4px"
elevation:
  cardShadow: "0px 2px 8px rgba(0,0,0,0.15)"
  hoverShadow: "0px 4px 16px rgba(0,0,0,0.12)"
components:
  MainCard:
    padding: "18px"
    shadow: "{elevation.cardShadow}"
    hoverShadow: "{elevation.hoverShadow}"
    borderRadius: "{shapes.cardRadius}"
  InputForm:
    spacing: "8px"
  SelectForm:
    spacing: "8px"
---

# Overview

Finper es una aplicación de finanzas personales diseñada para ofrecer una experiencia limpia, moderna y altamente intuitiva. Combina la robustez de Material UI (MUI v9) con la sutileza cromática de Ant Design. Esta guía define los estándares visuales que las IAs y desarrolladores deben seguir estrictamente para generar nuevos componentes de interfaz consistentemente.

---

# Colors

El esquema cromático utiliza los tokens mapeados en la propiedad `colors` de la cabecera YAML:
* **Primary** (`{colors.primary}`): Color azul de la marca para llamadas a la acción, botones destacados y estados activos.
* **Secondary** (`{colors.secondary}`): Gris para texto de soporte, iconos descriptivos y estados inactivos.
* **Success** (`{colors.success}`): Verde para saldos positivos, ingresos mensuales y metas completadas.
* **Warning** (`{colors.warning}`): Oro/Amarillo para presupuestos cercanos al límite y avisos importantes.
* **Error** (`{colors.error}`): Rojo para saldos negativos, eliminaciones de elementos y desviaciones graves de presupuesto.
* **Info** (`{colors.info}`): Cian para alertas informativas y diagnósticos del score de salud financiera.
* **Fondo de Papel** (`{colors.background.paper}`): Fondo blanco para tarjetas, diálogos y menús desplegables (`#ffffff`).
* **Fondo por Defecto** (`{colors.background.default}`): Fondo gris muy claro para el fondo principal de la aplicación (`#fafafa`).
* **Divisor** (`{colors.background.divider}`): Separadores sutiles y bordes de campo inactivos (`#f0f0f0`).

---

# Typography

La tipografía del sistema es `'Public Sans', sans-serif` (`{typography.fontFamily}`). Se estructuran las siguientes jerarquías de uso recomendado:
* **Heading 4 (`{typography.h4}`)**: Utilizado para balances principales, totales de cuentas y cifras clave en paneles.
* **Heading 5 (`{typography.h5}`)**: Subtítulos de sección y cifras de menor tamaño.
* **Heading 6 (`{typography.h6}`)**: Títulos dentro de tarjetas individuales (`MainCard`).
* **Subtitle 1 (`{typography.subtitle1}`)**: Nombre de transacciones o textos en negrita destacados.
* **Subtitle 2 (`{typography.subtitle2}`)**: Etiquetas secundarias de tamaño reducido.
* **Body 1 y 2 (`{typography.body1}`, `{typography.body2}`)**: Textos descriptivos generales y contenido estándar de tablas.
* **Caption (`{typography.caption}`)**: Anotaciones complementarias, límites porcentuales y notas pequeñas de aclaración.

*Nota:* Los textos de botón usan la propiedad `textTransform: 'capitalize'` en el tema para evitar el formato en mayúsculas de MUI.

---

# Layout

La distribución espacial en la pantalla sigue un sistema de rejilla flexible basado en filas de tamaño 12 (Grid 12 de MUI).
* **Espaciado de Contenedores:** La página principal se organiza bajo un `<Grid container spacing={3}>` (equivalente a `{spacing.lg}` de 24px) que garantiza márgenes uniformes entre widgets.
* **Alineación de Formularios:** Los campos superiores de un formulario inline (como inputs de texto o selectores) deben sumar exactamente `12` en resolución de escritorio (`md`) para evitar saltos y desalineaciones de botones inferiores.
* **Ejemplo de Fila Uniforme:**
```tsx
// Grid alignment formula for inline forms
const showExtra = categoryType === 'expense' && !!categoryParent
const size = showExtra ? 3 : 4 // sums to 12 in both scenarios
```

---

# Elevation & Depth

La jerarquía de capas y profundidad se apoya en sombras sutiles configuradas en el tema:
* **Card Shadow (`{elevation.cardShadow}`)**: Sombra por defecto para las tarjetas (`MainCard`), definida como `0px 2px 8px rgba(0,0,0,0.15)`.
* **Hover Shadow (`{elevation.hoverShadow}`)**: Sombra ampliada para indicar interactividad al pasar el cursor sobre tarjetas clicables (`0px 4px 16px rgba(0,0,0,0.12)`).

---

# Shapes

Las formas en Finper mantienen bordes redondeados limpios y uniformes:
* **Border Radius (`{shapes.borderRadius}`)**: Configurado en `8px` para diálogos, alertas y modales.
* **Card Radius (`{shapes.cardRadius}`)**: `8px` aplicado a todas las instancias de `MainCard`.
* **Button Radius (`{shapes.buttonRadius}`)**: `4px` para botones de acción.

---

# Components

La consistencia de la interfaz se logra mediante el uso obligatorio de los componentes del monorepo:

### 1. MainCard
El contenedor de datos por excelencia.
* Siempre debe tener el padding estándar: `contentSX={{ p: 2.25 }}` (equivalente a `{components.MainCard.padding}`).
* En filas de cuadrícula con alturas desiguales, forzar la altura completa usando `sx={{ height: '100%' }}`.
* Si representa un elemento de panel dinámico, añadir transiciones y hover sutiles:
```tsx
import { hoverCardSx } from 'pages/Dashboard/components/shared'
// hoverCardSx = {
//   transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
//   '&:hover': { transform: 'translateY(-2px)', boxShadow: '{elevation.hoverShadow}' }
// }
```

### 2. Envoltorios de Formulario (Forms)
Nunca instanciar componentes `<TextField>` o `<Select>` planos de MUI directamente. Usar los componentes del proyecto:
* `InputForm`: Caja de texto que registra campos con validación reactiva de `react-hook-form`.
* `SelectForm`: Desplegable nativo estilizado que recibe un array de opciones.
* `AutocompleteForm`: Selector con buscador de autocompletado para datos de gran volumen.
* `DateForm`: Selector de fecha unificado.

### 3. Alertas y Diagnósticos Semánticos
Para mostrar resúmenes de salud financiera o diagnósticos (como en la Regla 50/30/20):
* Usar fondos y bordes translúcidos con opacidades sutiles basadas en los colores del tema:
```tsx
const healthCardSx = {
  backgroundColor: theme.palette.success.light + '12', // semantic transparency (12 = ~7% opacity)
  border: `1px solid ${theme.palette.success.light + '33'}` // border transparency (33 = 20% opacity)
}
```

### 4. Micro-animaciones y Estados de Carga
* **Grow secuencial:** Al renderizar paneles, envolver las tarjetas en componentes `<Grow>` con retrasos secuenciales (`timeout` de 400, 500, 600, etc.) para dar una sensación fluida.
* **LinearProgress:** Usar alturas de `6px` para porcentajes estimados y de `8px` con degradados lineales (`linear-gradient`) para progresiones reales.

---

# Do's and Don'ts

### Do's (Permitido)
* **Do:** Utilizar variables del tema de MUI (`theme.palette.success.main`) para aplicar colores en lugar de codificar hexágonos de forma manual.
* **Do:** Asegurar que los inputs tengan siempre un `<InputLabel>` asociado mediante `htmlFor` para cumplir con WCAG 2.2.
* **Do:** Mantener variables y código fuente en inglés y usar nombres descriptivos completos.
* **Do:** Usar la fórmula de rejilla sumatoria de 12 para alinear de forma reactiva los campos en pantallas de escritorio.

### Don'ts (Prohibido)
* **Don't:** No usar Tailwind CSS ni agregar clases ad-hoc que rompan el sistema de Vanilla CSS y CSS-in-JS (MUI inline styles).
* **Don't:** No duplicar sombras o bordes personalizados en cajas sueltas; usa `MainCard`.
* **Don't:** No instanciar `<TextField>` puros para formularios principales de la aplicación.
* **Don't:** No usar letras individuales para nombrar variables de diseño o helpers de estilo.
