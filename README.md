# MyNutritor UI 🥗

Interfaz web moderna, ligera y ultrarrápida para la gestión nutricional integral de **MyNutritor**, desplegable como Single Page Application (SPA) 100% estática en **GitHub Pages** y conectada al backend de microservicios en **Google Cloud Run**.

Diseñada bajo los más altos estándares de **UI/UX Product Design**, **Accesibilidad Web (WCAG 2.1 AA)**, leyes de usabilidad (Ley de Fitts, Ley de Hick, Umbral de Doherty < 400ms) y **Clean Architecture desacoplada**.

---

## 🛠️ Stack Tecnológico

- **Framework & Runtime:** [SvelteKit](https://svelte.dev/) con Svelte 5 y TypeScript estricto (`strict: true`).
- **Despliegue Estático:** `@sveltejs/adapter-static` con fallback `404.html` y `.nojekyll` para enrutamiento SPA en GitHub Pages.
- **Estilos & Diseño:** [Tailwind CSS](https://tailwindcss.com/) con soporte para tema dinámico **Claro / Oscuro** sincronizado con el perfil del usuario.
- **Internacionalización (i18n):** Sistema tipado nativo bilingüe (**Español (`es`)** e **Inglés (`en`)**) con conmutación en 1 clic y detección del navegador.
- **Validación de Esquemas:** [Zod](https://zod.dev/) para contratos de entrada/salida (DTOs) en los límites de la API REST.
- **Testing & QA:** [Vitest](https://vitest.dev/) + `@testing-library/svelte` para pruebas unitarias y de mappers; [Playwright](https://playwright.dev/) para pruebas E2E.
- **Calidad de Código:** ESLint 9 (Flat Config) + Prettier con reglas estrictas de Clean Code.
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) automatizado para linting, type-check, tests y publicación en `main`.

---

## 🎨 Fundamentos de Diseño UI/UX y Accesibilidad (WCAG 2.1 AA)

1. **Ley de Fitts y Mínimos Clics (Zero-Friction Flows):**
   - **Registro de Macros en 2 Clics:** Botón persistente `+ Registrar Consumo` que despliega un drawer lateral sin abandonar la pantalla actual.
   - **Barra de Acciones Rápidas (Command Palette):** Accesible globalmente mediante `Ctrl + K` o `Cmd + K`, permitiendo navegar y ejecutar comandos por teclado.
   - **Acciones en Línea:** Marcado inmediato de alimentos excluidos de la dieta en `/foods` en un solo clic.
2. **Jerarquía Visual y Ley de Hick:**
   - Visualización clara del balance diario: Anillos/barras de progreso para Calorías, Proteína, Carbohidratos, Grasas y Agua.
   - Revelación progresiva (_Progressive Disclosure_): Detalles secundarios agrupados en drawers y pestañas.
3. **Feedback Inmediato y Actualizaciones Optimistas (Optimistic UI):**
   - **Doherty Threshold (< 400ms):** La UI actualiza el estado de inmediato y envía la solicitud al backend en segundo plano.
   - **Notificaciones Toast no intrusivas:** Con soporte para acción _"Deshacer"_ o _"Reintentar"_.
   - **Skeleton Loaders:** Reemplazan pantallas en blanco o spinners bloqueantes durante la carga.
4. **Diseño Mobile-First y Accesibilidad Operable por Teclado:**
   - Barra de navegación inferior nativa (_Bottom Nav_) para pantallas móviles.
   - Navegación completa por teclado (`Tab`, `Enter`, `Escape`), etiquetas `<label>` explícitas, atributos `aria-live` y contraste superior a 4.5:1.

---

## 📐 Arquitectura Modular del Proyecto

```
src/
├── lib/
│   ├── core/                    # Núcleo agnóstico de negocio
│   │   ├── config/env.ts        # Variables de entorno y constantes de red
│   │   ├── http/HttpClient.ts   # Abstracción HTTP con inyección JWT y reintentos
│   │   ├── storage/TokenStorage.ts # Persistencia segura de sesión (Browser / Memory)
│   │   ├── i18n/                # Internacionalización bilingüe (i18n.store.ts, translations.ts)
│   │   └── feedback/            # Sistema de notificaciones Toast (toast.store.ts)
│   │
│   ├── domain/                  # Entidades puras y contratos de repositorios
│   │   ├── auth/                # Usuario, credenciales, interfaz IAuthRepository
│   │   ├── system/              # Estado de salud e interfaz ISystemRepository
│   │   ├── users/               # Macros, reportes, exclusiones, borradores
│   │   ├── recipes/             # Recetas e interfaz IRecipeRepository
│   │   ├── food-items/          # Catálogo de alimentos e interfaz IFoodItemRepository
│   │   ├── settings/            # Configuración móvil y feature flags
│   │   ├── roles/               # Gestión de roles y permisos
│   │   └── backup/              # Copias de respaldo y restauración
│   │
│   ├── infrastructure/          # Implementación técnica y adaptadores
│   │   ├── dtos/                # Esquemas Zod para validación de API
│   │   ├── mappers/             # Data Mappers (DTO -> Entidad de Dominio)
│   │   ├── repositories/        # Implementación concreta de repositorios REST
│   │   └── container.ts         # Contenedor de Inyección de Dependencias
│   │
│   ├── application/             # Casos de uso y estado reactivo (Svelte Stores)
│   │   ├── auth/                # Sesión, roles (Admin vs User), presets de demostración
│   │   ├── macros/              # Gestión de macros diarios con actualización optimista
│   │   ├── foods/               # Catálogo, filtros, búsqueda y exclusiones dietéticas
│   │   ├── recipes/             # Recetario y gestión de permisos de colaboradores
│   │   ├── reports/             # Generación de informes y cálculo de promedios
│   │   ├── drafts/              # Bandeja de borradores de comida e ideas IA
│   │   ├── admin/               # Administración global, roles, flags y backups
│   │   ├── settings/            # Metas nutricionales y sincronización de tema
│   │   └── theme/               # Modo Claro / Oscuro dinámico
│   │
│   └── ui/                      # Componentes visuales
│       ├── components/          # Atómicos (Button, Input, Badge, Card, Drawer, Modal, ToastContainer, BottomNav, CommandPalette, LanguageToggle)
│       └── features/            # Módulos compuestos (HealthIndicator, LoginForm, DashboardSummary)
│
└── routes/                      # Enrutamiento Estático de SvelteKit
    ├── +layout.svelte / +layout.ts # Shell estático global (prerender = true, ssr = false)
    ├── +page.svelte             # Portada y bienvenida con Health Check en vivo
    ├── login/ & register/       # Acceso y alta con backend real y modos demo
    ├── dashboard/               # Resumen diario con selectores y registro rápido
    ├── macros/                  # Historial y registro de macronutrientes
    ├── foods/                   # Catálogo de alimentos y exclusiones dietéticas
    ├── recipes/                 # Recetario con cálculo de porciones y colaboradores
    ├── reports/                 # Informes nutricionales y modo impresión/PDF
    ├── drafts/                  # Bandeja de borradores e interacción con IA
    ├── settings/                # Ajustes de metas, perfil, idioma y tema
    ├── admin/                   # Consola administrativa para usuarios, roles y backups
    └── help/                    # Centro de ayuda interactivo bilingüe y FAQs
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Ejecutar verificación de tipos (TypeScript + Svelte diagnostics)
npm run check

# Ejecutar suite de pruebas unitarias (Vitest)
npm run test

# Formatear y verificar linter
npm run format
npm run lint

# Compilar sitio estático para producción (salida en /build)
npm run build

# Previsualizar sitio estático localmente
npm run preview

# Ejecutar pruebas E2E (Playwright)
npm run test:e2e
```

---

## 🌐 Conexión al Backend

Por defecto, la aplicación apunta a la instancia de producción en Google Cloud Run:
`https://my-nutritor-be-74319366403.us-central1.run.app`

Se puede configurar mediante variables de entorno en `.env`:

```env
VITE_API_BASE_URL=https://my-nutritor-be-74319366403.us-central1.run.app
```
