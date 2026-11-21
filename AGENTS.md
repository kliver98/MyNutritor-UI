# AGENTS.md - Reglas e Instrucciones para Modelos y Agentes Autónomos

> [!TIP]
> **DIRECTIVA DE OPERACIÓN ÁGIL Y EFICIENTE (PROYECTO PERSONAL MONOUSUARIO):**
> Este repositorio es un proyecto personal desarrollado exclusivamente por el usuario y el agente.
>
> - **Cero Lecturas Previas Redundantes:** El agente **NO DEBE** leer archivos de `.agent/skills/` de forma obligatoria en cada prompt. Toda la arquitectura, estándares y reglas de negocio esenciales ya están consolidadas directamente en este archivo (inyectado a coste 0 en tu contexto inicial).
> - **Acceso Bajo Demanda:** Las guías en `.agent/skills/` (`architecture-and-cleancode.md`, `adding-new-features.md`, `testing-standards.md`) son solo de referencia opcional cuando se diseñe una nueva entidad completa desde cero. Para corrección de bugs, ajustes de UI, estilos, linter o componentes existentes, ve **directamente** al archivo destino.
> - **Verificación Rápida y Focalizada (Fast-Track):** En cambios ligeros, cosméticos o de UI, corre únicamente el test específico o `npm run check`. No corras la suite completa de 81 tests a menos que se modifique lógica transversal de dominio o stores globales. Para formateo, aplica `npx prettier --write <archivo_modificado>`.

---

## 1. Directrices de Arquitectura y Clean Code (En Memoria)

1. **Arquitectura Limpia Desacoplada (Clean Architecture):**
   - Flujo unidireccional estricto: `UI -> Application (Stores) -> Infrastructure (Repositories, DTOs & Mappers) -> Core (HttpClient)`.
   - `src/lib/domain/`: Entidades y tipos de negocio puros. **Nunca depende de la UI ni de infraestructura**.
   - `src/lib/infrastructure/`: Implementaciones de repositorios, DTOs y Mappers explícitos.
   - `src/lib/application/`: Orquestación de estado reactivo mediante Svelte Stores (`writable`, `derived`).
   - `src/lib/ui/`: Componentes y vistas. **PROHIBIDO hacer llamadas directas a `fetch` o repositorios desde la UI**; toda acción pasa por los stores.
2. **Patrón Data Mapper y Tipado Estricto:**
   - Cero uso de `any` (usar `unknown` con validación estricta de **Zod** para entradas de API).
   - Todo DTO de la API debe validarse con schema Zod y transformarse a entidad de dominio mediante un Mapper.
3. **Svelte 5 Runes:**
   - Usar runes oficiales: `$state`, `$derived`, `$props`, `$bindable`, `$effect`. Cero sintaxis obsoleta de Svelte 4 (`export let`, `let:`).
4. **Despliegue Estático:**
   - Generación estática para GitHub Pages (`@sveltejs/adapter-static` con `fallback: '404.html'`).
   - `prerender = true; ssr = false;` en `src/routes/+layout.ts`.
5. **Testing Focalizado:**
   - Mappers, repositorios y utilidades cuentan con pruebas unitarias en Vitest.

---

## 2. Reglas de Negocio Oficiales de la Aplicación

1. **Mapeo de Roles y Permisos:**
   - En Firestore y respuestas del backend, `roleId: 1` corresponde estrictamente a `admin`, y `roleId: 2` a `user`. La UI jamás debe mostrar a un administrador con `roleId: 1` como usuario común.

2. **Confirmación Obligatoria en Eliminaciones (Regla Crítica):**
   - **TODA** acción de borrado o eliminación en la aplicación (usuarios, registros de alimentos, recetas, comidas del día) **DEBE solicitar confirmación obligatoria al usuario mediante modal** antes de ejecutar la petición al backend. Jamás realizar eliminaciones directas.

3. **Fidelidad Estricta a los Datos del Backend (Cero Atributos Inventados):**
   - **Usuarios:** La tabla administrativa de usuarios no debe inventar ni mostrar atributos que el backend no retorne (ej. no renderizar columnas `email` o fecha de creación ficticia si el backend no los provee).
   - **Configuración Móvil (`app_settings/mobile`):** El documento en Firestore contiene exclusivamente:
     - `appName`
     - `currentVersion`
     - `defaultTheme`
     - `featureFlags`: únicamente `google_sign_in_enabled` y `work_offline_enabled`.
     - Queda prohibido inventar o renderizar campos como versión mínima, email de soporte, escáner de código de barras, recetas comunitarias o nutricionista IA.

4. **Registro de Comidas y Alimentos (`users/{username}/reports`):**
   - No se utiliza registro rápido manual sin desglose.
   - El flujo oficial es el modal completo de registro (`MealLogModal`):
     - Título del plato / comida con sugerencias rápidas.
     - Selección de 1 o más alimentos del catálogo con cantidades dinámicas editables.
     - Selección de recetas guardadas con auto-carga de todos sus ingredientes y cantidades proporcionales.
     - Resumen nutricional calculado (calorías, proteínas, carbohidratos, grasas).
     - Comparativa de impacto en los macros del día (al lado derecho en pantallas grandes, debajo en móviles).
     - Guardado en `users/{username}/reports` en formato Markdown estándar estructurado:
       `### 🥗 NOMBRE DEL ALIMENTO`, `### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA`, `### 💡 EVALUACIÓN Y RECOMENDACIONES` y desglose numerado de ingredientes consumidos.
     - Actualización automática acumulada en `daily_macros`.

5. **Reportes e Impresión de Alimentos (`/reports`):**
   - Selector de fechas con 3 opciones obligatorias: 7 días, 14 días y Personalizado (máximo 2 meses con selector tipo Booking/Aerolíneas interactivo).
   - Agrupación por días con totales de macronutrientes y calorías por jornada.
   - Cada registro muestra su hora real extraída del campo `timestamp` del backend (`parseReportTimestamp`). **PROHIBIDO** inventar horas genéricas fijas (`08:15`, `13:30`, `20:00`). Si no hay hora registrada, se muestra `--:--`.
   - Dropdown interactivo en cada comida para desplegar el desglose de alimentos consumidos (`MealBreakdownItem`).
   - Al exportar o imprimir (`window.print()`):
     - Todos los dropdowns deben expandirse automáticamente para visibilizar todos los alimentos consumidos.
     - Se muestra un membrete de impresión con el nombre del perfil y la fecha/hora de generación del reporte (oculto en la navegación web normal).

6. **Estándares Visuales y Responsive Mobile:**
   - **Backdrops de Modales:** Todo modal, drawer y command palette debe utilizar `bg-slate-950/95 backdrop-blur-md` cubriendo la pantalla completa para oscurecer y difuminar totalmente el header y fondos, evitando cualquier distracción visual.
   - **Entradas en Móvil (360px+):** Todos los inputs, selects y contenedores flexibles deben incluir `min-w-0` y comportamiento adaptativo (`flex-col sm:flex-row`), previniendo desbordamientos horizontales o defasamiento en pantallas pequeñas.
   - **Contraste en Contenedores (`Card`, `Modal`, `Drawer`):** Todos los componentes contenedores que utilicen fondos claros (`bg-white dark:bg-slate-900`) deben forzar `text-slate-900 dark:text-slate-100` para evitar que hereden estilos de texto blanco si el usuario define fondos de pantalla personalizados oscuros.

7. **Propiedad y Modificación de Recetas:**
   - **Solo los dueños pueden modificar:** Únicamente el usuario creador/dueño de una receta (`isRecipeOwner`) tiene permisos para modificarla, editar sus permisos/colaboradores (`openPermissionsModal`) o eliminarla (`confirmDeleteRecipe`).
   - **Recetas ajenas:** Si una receta pertenece a otro usuario (pública o compartida), la UI debe renderizarla en modo de solo lectura, ocultando los botones de permisos y eliminación, e indicando la procedencia (`Receta de: @autor` o badges `Pública`/`Compartida`).
   - **Restricción de API de Usuarios:** El endpoint `GET /api/v1/users` es exclusivo para administradores (`roleId: 1`). Los usuarios estándar (`roleId: 2`) jamás deben invocar este endpoint; la UI debe omitir la precarga de usuarios para roles estándar y evitar errores `403 Forbidden`.

8. **Despliegue Continuo Automatizado (CI/CD a GitHub Pages):**
   - **Push a `main` desencadena despliegue:** Cada `push` directo a la rama `main` activa automáticamente el workflow de GitHub Actions (`.github/workflows/deploy.yml`), el cual compila, ejecuta pruebas unitarias (`npm run test:run`), validaciones de tipos (`npm run check`), linter (`npm run lint`), compila el sitio estático (`npm run build`) y lo despliega a la rama `gh-pages`.
   - **Verificación Local Obligatoria:** Antes de hacer commit y push a `main`, el agente debe verificar que `npm run check`, `npm run lint` y los tests pasen exitosamente al 100% para garantizar que el pipeline remoto finalice en verde.

