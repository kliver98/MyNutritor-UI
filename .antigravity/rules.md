# Antigravity Rules - MyNutritor UI

# ==============================================================================

# MANDATORY SELF-INJECTION DIRECTIVE

# Before writing, planning, or modifying any code in this repository, you MUST inspect

# and adhere to the skills in .agent/skills/:

# - .agent/skills/architecture-and-cleancode.md

# - .agent/skills/adding-new-features.md

# - .agent/skills/testing-standards.md

# ==============================================================================

## Core Guidelines

- Clean Architecture: Decouple domain from infrastructure and UI.
- No direct `fetch` in UI components or pages.
- Data mapper pattern with Zod validation for all API inputs and outputs.
- SvelteKit static adapter (`@sveltejs/adapter-static`) for GitHub Pages (`fallback: '404.html'`).
- Always run `npm run check` and `npm run test` before finishing tasks.
