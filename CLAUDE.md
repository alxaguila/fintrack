# FinTrack

App personal de gestión financiera (estilo Fintonic). Multi-perfil sobre un único usuario de Supabase.

## Stack

React 18 + TypeScript + Vite · Supabase (PostgreSQL + Auth, con RLS) · Tailwind CSS · TanStack Query v5 · react-i18next · Recharts · PapaParse · SheetJS. Sin vitest en el proyecto (validaciones puntuales con scripts ad-hoc de Node).

## Arquitectura clave

- `financial_profiles` son personas financieras (Alex, Papá, Mamá...), **no** son usuarios de Supabase Auth. Un usuario puede tener varios perfiles.
- `categories.slug` (inglés, snake_case) es la clave i18n — no existe columna `name`; el nombre se resuelve con `t(\`category.${slug}\`)`.
- `keyword_rules.profile_id` nullable: NULL = aplica a todos los perfiles del usuario.
- Dedup de movimientos importados: `dedup_hash = SHA256(date|amount|concepto_normalizado)`, UNIQUE por cuenta.
- **Cadena de clasificación al importar** (`src/lib/classify.ts`): reglas del usuario → regla de comunidad (votos ≥ `COMMUNITY_VOTE_THRESHOLD`) → diccionario built-in → sin categoría. Solo corre en el import (`useImport.ts`), no hay botón de "auto-categorizar" a posteriori.
- **Reglas de clasificación**: gestión en `/transactions/rules` (`ClassificationRules.tsx`). La creación de reglas solo ocurre desde el diálogo de revisión de una transacción ("Crear regla"); la pantalla de Reglas solo busca/edita/borra.
- **Transferencias entre cuentas propias** (`src/lib/transferMatch.ts`): se detectan automáticamente al importar y se marcan `transaction_type = 'no_computable'` (no cuentan en KPIs del Dashboard). Solo se dispara para cuentas bancarias (no tarjetas).
- **Dashboard**: usa vistas agregadas en BD (`v_dashboard_totals`, `v_dashboard_breakdown`, `security_invoker`) en vez de traer todo el histórico al cliente — Supabase/PostgREST corta a 1000 filas por defecto, así que cualquier hook nuevo de agregados debe seguir este patrón, no volver a `useAllTransactions`.

## Sistema de diseño (obligatorio converger en pantallas nuevas)

- **Paleta**: ingreso/positivo = teal `#14B8A6`; gasto/negativo = rosa palo `#CB6391`; no computable = gris `#64748b`/`#94a3b8`. Sin semáforo verde/rojo.
- **Pastillas de categoría**: `rounded-full px-2 py-0.5 text-xs font-medium`, icono de grupo (`groupIcon()` en `src/lib/categoryIcons.ts`) + color del grupo, fondo tintado ~12% (`${color}1f`).
- **Redondeos**: tarjetas, tablas, paneles y diálogos en `rounded-2xl` (no `rounded-lg`).
- **Tipografías**: títulos de página `text-3xl font-extrabold tracking-tight`; títulos de sección `text-[15px] font-bold`; conceptos de movimiento en `font-mono uppercase`.
- **Diálogos**: separadores a sangre `-mx-6 w-auto bg-slate-300`, `sm:rounded-2xl`, `max-h-[90dvh] overflow-y-auto`.

## Reglas de trabajo obligatorias (aunque no se pidan explícitamente)

1. **Móvil**: toda UI nueva debe ser responsive — `w-full` en vez de anchos fijos en px, `break-words`, acciones/footers que se apilen en pantallas estrechas, diálogos con `max-h-[90dvh] overflow-y-auto`, evitar `position: fixed` salvo modales.
2. **Multiidioma**: la app debe construirse pensando en internacionalización. Todo texto de UI nuevo pasa por `react-i18next` (sin strings hardcoded), añadiendo traducciones como mínimo en **español e inglés**.
3. **Convergencia de diseño**: si una pantalla nueva o tocada diverge del sistema de diseño anterior, alinearla de paso.
4. **No levantar preview/dev server** para validar cambios visuales — el usuario lo comprueba en producción y aporta capturas si hace falta. Basta con que compile (`npx tsc -b` / `npm run build`).
5. **Versionado**: en **cada prompt/comando ejecutado** hay que subir la versión. Incrementar en 1 el sufijo de `APP_VERSION` en `src/lib/version.ts` (v1.001 → v1.002 → v1.003…). Es lo primero o lo último de cada ejecución, siempre. La versión se muestra en pequeñito y gris a la derecha del logo `fintrack` en el sidebar.

## Comandos / setup

- Primer arranque: `npm install && npm run dev`.
- Supabase: ejecutar en orden `supabase/migrations/001_schema.sql` → `002_trigger.sql` → `003_community_rules.sql` → `004_keyword_rule_amount.sql` → `004_dashboard_aggregation.sql` → `005_account_logos.sql` → `006_account_type_valores.sql` → `007_bank_entities.sql` → `008_taxonomy_v2.sql` → `009_card_settlement_category.sql` → `010_opening_balance.sql` → `011_input_constraints.sql` → … → `018_security_linter_fixes.sql` → `019_user_bank_suggestions.sql` → `020_user_name_split.sql` + `supabase/seed.sql`, y rellenar `.env.local` con URL y anon key reales.
- Reset de datos de prueba (simular usuario nuevo): `supabase/reset_data.sql` en el SQL Editor de Supabase (conserva `auth.users`, `user_settings` y taxonomía de categorías).
- Build: `npm run build` (pasa solo con warning de tamaño de chunk >500kB).

## Gotchas ya resueltos (no reintroducir)

- `database.types.ts` debe declarar `Row/Insert/Update` como `type`, no `interface` (si no, supabase-js tipa los `.insert()/.update()` como `never`).
- `parseDate` en `useImport.ts`: cuidado con shadowear el `format` importado de date-fns con un parámetro del mismo nombre.
- `parseAmount` es locale-aware (detecta si `.`/`,` es decimal o millares); no asumir formato español fijo — los XLSX binarios renderizan decimales con punto.
- Los parsers de importación deben aplicar `detectHeaderRowIndex` (no solo el parser HTML-as-xls) para no tomar una fila de título como cabecera.
