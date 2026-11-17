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

---

## Reglas de Negocio Oficiales de la Aplicación

1. **Mapeo de Roles y Permisos:**
   - En la base de datos Firestore y respuestas del backend, `roleId: 1` corresponde estrictamente a `admin`, y `roleId: 2` a `user`. La UI jamás debe mostrar a un administrador con `roleId: 1` como usuario común.

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
   - Selector de fechas con 3 opciones obligatorias: 7 días, 14 días y Personalizado (máximo 2 meses).
   - Agrupación por días con totales de macronutrientes y calorías por jornada.
   - Cada registro muestra su hora real extraída del campo `timestamp` del backend (`parseReportTimestamp`). **PROHIBIDO** inventar horas genéricas fijas (`08:15`, `13:30`, `20:00`). Si no hay hora registrada, se muestra `--:--`.
   - Dropdown interactivo en cada comida para desplegar el desglose de alimentos consumidos (`MealBreakdownItem`).
   - Al exportar o imprimir (`window.print()`):
     - Todos los dropdowns deben expandirse automáticamente para visibilizar todos los alimentos consumidos.
     - Se muestra un membrete de impresión con el nombre del perfil y la fecha/hora de generación del reporte (oculto en la navegación web normal).

6. **Estándares Visuales y Responsive Mobile:**
   - **Backdrops de Modales:** Todo modal, drawer y command palette debe utilizar `bg-slate-950/95 backdrop-blur-md` cubriendo la pantalla completa para oscurecer y difuminar totalmente el header y fondos, evitando cualquier distracción visual.
   - **Entradas en Móvil (360px+):** Todos los inputs, selects y contenedores flexibles deben incluir `min-w-0` y comportamiento adaptativo (`flex-col sm:flex-row`), previniendo desbordamientos horizontales o defasamiento en pantallas pequeñas.
