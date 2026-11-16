# Estándares de Testing y Calidad (.agent/skills)

Este documento define la estrategia de pruebas para **MyNutritor-UI**.

## 1. Pirámide de Pruebas

1. **Pruebas Unitarias Rápidas (Vitest):**
   - Cobertura objetivo: >= 80% en lógica de negocio (`domain`), transformación de datos (`mappers`), validación (`Zod DTOs`) y utilidades de red (`HttpClient`).
   - Mocking de `IHttpClient`: Nunca hacer llamadas de red reales en pruebas unitarias de repositorios. Inyectar un mock de `IHttpClient` que devuelva respuestas simuladas o errores específicos.
2. **Pruebas de Componentes (Vitest + @testing-library/svelte):**
   - Probar accesibilidad, renderizado condicional, manejo de eventos y estados de error/carga en componentes clave.
3. **Pruebas End-to-End (Playwright):**
   - Flujos críticos:
     - Health Check del backend visible en UI.
     - Login exitoso y redirección al Dashboard.
     - Rechazo de credenciales inválidas.
     - Conmutación de tema (Dark / Light mode).
     - Visualización segregada por roles (`Admin` vs `User`).

## 2. Convenciones para Tests Unitarios

- Nombre de archivo: `*.test.ts` junto al archivo bajo prueba o en su carpeta correspondiente.
- Estructura AAA (Arrange, Act, Assert).
- Uso de helpers para fixtures de DTOs válidos e inválidos.

## 3. Criterios de Aceptación para Dar una Tarea por Terminada

Antes de considerar un cambio o feature completado:

1. `npm run check` (TypeScript y svelte-check) debe pasar con 0 errores y 0 warnings críticos.
2. `npm run test` (Vitest) debe pasar 100% en verde.
3. `npm run build` debe generar el bundle estático en `build/` sin errores de prerenderizado.
4. No deben quedar `console.log` de depuración en código productivo.
