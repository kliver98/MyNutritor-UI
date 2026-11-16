# GitHub Copilot Instructions - MyNutritor UI

# ==============================================================================

# MANDATORY SELF-INJECTION DIRECTIVE

# You MUST read and follow the instructions in:

# - .agent/skills/architecture-and-cleancode.md

# - .agent/skills/adding-new-features.md

# - .agent/skills/testing-standards.md

# prior to formulating architectural plans, refactoring, or generating code.

# ==============================================================================

1. Always use TypeScript strict mode. Prohibit `any`.
2. Encapsulate all API traffic in `IHttpClient` and concrete repositories.
3. Validate and map all backend responses with Zod schemas and Data Mappers.
4. Keep UI components presentational. State and business logic live in `application` and `domain`.
5. Support dynamic light and dark theme classes for Tailwind CSS.
