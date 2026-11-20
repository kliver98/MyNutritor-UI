# Antigravity Rules - MyNutritor UI

## Directrices de Eficiencia y Reglas del Proyecto

- **Fuente Única de Verdad:** Consulta [AGENTS.md](file:///c:/Projects/MyNutritor-UI/AGENTS.md) para todas las reglas de negocio, estándares de UI y Clean Architecture.
- **Flujo Directo (Fast-Track):** No leas archivos de guías previas en cada prompt. Ve directamente al código objetivo para resolver bugs, cambios visuales o peticiones puntuales.
- **Clean Architecture:** Flujo unidireccional `UI -> Application (Stores) -> Infrastructure (Repositories & Mappers) -> Core (HttpClient)`. Sin llamadas directas a `fetch` en la UI.
- **Tipado Estricto:** Cero `any`, validación Zod en DTOs.
- **Svelte 5 Runes:** Uso exclusivo de `$state`, `$derived`, `$props`, `$bindable`, `$effect`.
- **Despliegue Estático:** SvelteKit static adapter (`@sveltejs/adapter-static`) para GitHub Pages.
- **Verificación Adaptativa:** Para cambios ligeros, corre solo `npm run check` o el test del archivo específico.
