# AGENTS.md - Reglas e Instrucciones para Modelos y Agentes Autónomos

> [!IMPORTANT]
> **DIRECTIVA OBLIGATORIA DE AUTOINYECCIÓN DE CONTEXTO:**
> Todo modelo de lenguaje, asistente de codificación o agente autónomo (Antigravity, Cursor, Windsurf, Copilot, Claude Code, Gemini) que opere en este repositorio **DEBE LEER OBLIGATORIAMENTE** los siguientes archivos de habilidades antes de responder, planificar o realizar cualquier modificación de código:
>
> 1. [architecture-and-cleancode.md](file:///c:/Projects/MyNutritor-UI/.agent/skills/architecture-and-cleancode.md)
> 2. [adding-new-features.md](file:///c:/Projects/MyNutritor-UI/.agent/skills/adding-new-features.md)
> 3. [testing-standards.md](file:///c:/Projects/MyNutritor-UI/.agent/skills/testing-standards.md)
>
> Ignorar estas reglas o escribir código acoplado sin seguir la Clean Architecture resultará en rechazo del Pull Request.

---

## Directrices Clave de MyNutritor UI

1. **Arquitectura Limpia Desacoplada (Clean Architecture):**
   - Respetar el flujo unidireccional: `UI -> Application (Stores) -> Infrastructure (Repositories & Mappers) -> Core (HttpClient)`.
   - `src/lib/domain/` nunca depende de la UI ni de librerías de infraestructura.
2. **Tipado Estricto:**
   - Cero uso de `any`.
   - Validación de entradas/salidas con `zod`.
3. **Despliegue Estático:**
   - Generación estática para GitHub Pages (`@sveltejs/adapter-static` con `fallback: '404.html'`).
   - `prerender = true; ssr = false;` en `src/routes/+layout.ts`.
4. **Testing Obligatorio:**
   - Mappers, repositorios y HttpClient deben contar con pruebas unitarias en Vitest.
   - Tests de regresión e2e en Playwright.
