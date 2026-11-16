# MyNutritor UI - Guía de Arquitectura y Clean Code (.agent/skills)

Esta guía define las reglas no negociables de diseño de software, principios SOLID y Clean Code para el proyecto **MyNutritor-UI**.

## 1. Principios Fundamentales

- **Separación Estricta de Capas (Clean Architecture):**
  - `core`: Infraestructura agnóstica de negocio (HTTP, Storage, i18n, Feedback/Toast).
  - `domain`: Reglas de negocio puras, interfaces de repositorios, entidades. **Cero dependencias del framework UI o librerías externas (salvo tipos puros)**.
  - `infrastructure`: Implementación de interfaces de repositorios, clientes de red, validación Zod y Data Mappers explícitos.
  - `application`: Casos de uso y orquestación del estado reactivo (Svelte stores).
  - `ui`: Componentes presentacionales y vistas de características. **PROHIBIDO realizar llamadas a `fetch` o repositorios directamente en componentes atómicos**.
- **Prohibición de `any`:** Todo tipo debe ser explícito. Si un tipo de entrada externo es desconocido, usa `unknown` y valida con **Zod** antes de acceder a sus propiedades.
- **Data Mapper Obligatorio:** Los datos crudos de la API (DTOs) nunca entran al dominio o a la UI sin antes pasar por un schema Zod y un mapper explícito que transforme a la entidad de dominio.

## 2. Principios de UI/UX y Accesibilidad (WCAG 2.1 AA)

- **Ley de Fitts y Mínimos Clics (Zero-Friction):**
  - Flujos frecuentes (registro de macros, búsqueda de alimentos, creación de recetas) en **<= 2 a 3 clics**.
  - Uso de Drawers (`Drawer.svelte`), Modales accesibles (`Modal.svelte`) y Command Palette global (`Ctrl + K`).
- **Feedback Inmediato (< 400ms) y Optimistic UI:**
  - Las acciones del usuario (guardar macro, toggle de exclusión, borrar receta) reflejan el cambio de inmediato en el store local.
  - Notificaciones no intrusivas mediante `toastStore` con acciones _"Deshacer"_ o _"Reintentar"_ ante fallos de red.
  - Uso mandatorio de `Skeleton.svelte` para estados de carga.
- **Internacionalización Obligatoria (i18n):**
  - Todo texto visible en componentes y vistas debe resolverse mediante `$t('clave.traduccion')`.
  - Soporte tipado en `src/lib/core/i18n/` para Español (`es`) e Inglés (`en`).
- **Navegación Móvil y Teclado:**
  - Barra inferior `BottomNav.svelte` en pantallas móviles.
  - Operabilidad 100% por teclado (`Tab`, `Enter`, `Escape`), etiquetas `<label>` vinculadas y atributos ARIA.

## 3. Límites de Complejidad y Tamaño

- **Archivos / Módulos:** Máximo 250 líneas por archivo.
- **Funciones:** Máximo 30 líneas por función (Principio de Responsabilidad Única - SRP).
- **Componentes Svelte:** Máximo 200 líneas por componente `.svelte`. Si crece, extraer subcomponentes en `src/lib/ui/components/`.

## 4. Patrones de Diseño Obligatorios

- **Repository Pattern:** Todo acceso a datos se hace mediante interfaces `IXRepository` definidas en `src/lib/domain/` e implementadas en `src/lib/infrastructure/repositories/`.
- **Adapter / Strategy en HTTP:** Todo tráfico REST se canaliza exclusivamente por `IHttpClient` (`src/lib/core/http/HttpClient.ts`).
- **Data Mapper Pattern:** Todo DTO recibido se valida con un esquema Zod (`src/lib/infrastructure/dtos/`) y se mapea mediante una clase mapper (`src/lib/infrastructure/mappers/`).
