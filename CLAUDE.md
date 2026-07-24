# zafyros

App personal de gestión financiera (estilo Fintonic). Multi-perfil sobre un único usuario de Supabase.

## Stack

React 18 + TypeScript + Vite · Supabase (PostgreSQL + Auth, con RLS) · Tailwind CSS · TanStack Query v5 · react-i18next · Recharts · PapaParse · SheetJS. Sin vitest en el proyecto (validaciones puntuales con scripts ad-hoc de Node).

## Arquitectura clave

- `financial_profiles` son personas financieras (Alex, Papá, Mamá...), **no** son usuarios de Supabase Auth. Un usuario puede tener varios perfiles.
- `categories.slug` (inglés, snake_case) es la clave i18n — no existe columna `name`; el nombre se resuelve con `t(\`category.${slug}\`)`.
- `keyword_rules.profile_id` nullable: NULL = aplica a todos los perfiles del usuario.
- Dedup de movimientos importados: `dedup_hash = SHA256(date|amount|concepto_normalizado)`, UNIQUE por cuenta.
- **Cadena de clasificación al importar** (`src/lib/classify.ts`): reglas del usuario → regla de comunidad (votos ≥ `COMMUNITY_VOTE_THRESHOLD`) → diccionario integrado → sin categoría. Solo corre en el import (`useImport.ts`), no hay botón de "auto-categorizar" a posteriori (si el diccionario mejora después, los movimientos ya importados y sin categoría NO se reclasifican solos).
- **Diccionario integrado**: vive en la tabla `dictionary_rules` (migración 032), editable desde `/admin/reglas` → pestaña "Diccionario" (antes era un array fijo en `categoryRules.ts`). Match por palabra completa (no "contiene"); `applies_to_bizum` replica las antiguas `ALWAYS_RULES` (NOMINA, PARKING, COMUNIDAD), que clasifican incluso en un Bizum entre personas.
- **Contador de uso** (migración 033): tanto el diccionario (`dictionary_rules.use_count`) como las reglas de comunidad (tabla aparte `community_rule_usage`, indexada por `merchant_key`) llevan cuántas veces han clasificado un movimiento. Se incrementa vía RPC (`increment_dictionary_usage` / `increment_community_usage`) solo al CONFIRMAR una importación (`useConfirmImport`), no en la vista previa. `community_rule_usage` va en tabla aparte porque `community_rules` se borra/reinserta entera en cada voto (`recompute_community_rule`, migración 003) y perdería cualquier columna extra.
  - **Importante — solo prospectivo**: el contador arranca en 0 en la migración 033 y solo suma con importaciones hechas DESPUÉS de aplicarla. No refleja cuántas veces ese comercio ya existe en el histórico de `transactions` previo. Antes de usarlo para decidir prioridades (p. ej. qué comercio tener logo primero en la futura `/admin/comercios`), hace falta un backfill puntual que recorra el histórico existente y siembre los contadores retroactivamente — ver brief pendiente en el chat / memoria `project_merchant_catalog`.
- **Reglas de clasificación**: gestión en `/transactions/rules` (`ClassificationRules.tsx`). La creación de reglas solo ocurre desde el diálogo de revisión de una transacción ("Crear regla"); la pantalla de Reglas solo busca/edita/borra.
- **Transferencias entre cuentas propias** (`src/lib/transferMatch.ts`): se detectan automáticamente al importar y se marcan `transaction_type = 'no_computable'` (no cuentan en KPIs del Dashboard). Solo se dispara para cuentas bancarias (no tarjetas).
- **Dashboard**: usa vistas agregadas en BD (`v_dashboard_totals`, `v_dashboard_breakdown`, `security_invoker`) en vez de traer todo el histórico al cliente — Supabase/PostgREST corta a 1000 filas por defecto, así que cualquier hook nuevo de agregados debe seguir este patrón, no volver a `useAllTransactions`.

## Sistema de diseño (obligatorio converger en pantallas nuevas)

- **Paleta**: ingreso/positivo = teal `#14B8A6`; gasto/negativo = rosa palo `#CB6391`; no computable = gris `#64748b`/`#94a3b8`. Sin semáforo verde/rojo.
- **Pastillas de categoría**: `rounded-full px-2 py-0.5 text-xs font-medium`, icono de grupo (`groupIcon()` en `src/lib/categoryIcons.ts`) + color del grupo, fondo tintado ~12% (`${color}1f`).
- **Redondeos**: tarjetas, tablas, paneles y diálogos en `rounded-2xl` (no `rounded-lg`).
- **Tipografías**: títulos de página `text-3xl font-extrabold tracking-tight`; títulos de sección `text-[15px] font-bold`; conceptos de movimiento en `font-mono uppercase`.
- **Diálogos**: separadores a sangre `-mx-6 w-auto bg-slate-300`, siempre redondeados (`rounded-2xl`, con margen respecto al borde de pantalla incluso en móvil — desde v1.65x ya no van a pantalla completa por debajo de `sm`), `max-h-[90dvh] overflow-y-auto`.

## Reglas de trabajo obligatorias (aunque no se pidan explícitamente)

1. **Móvil**: toda UI nueva debe ser responsive — `w-full` en vez de anchos fijos en px, `break-words`, acciones/footers que se apilen en pantallas estrechas, diálogos con `max-h-[90dvh] overflow-y-auto`, evitar `position: fixed` salvo modales.
2. **Multiidioma**: la app debe construirse pensando en internacionalización. Todo texto de UI nuevo pasa por `react-i18next` (sin strings hardcoded), añadiendo traducciones como mínimo en **español e inglés**.
3. **Convergencia de diseño**: si una pantalla nueva o tocada diverge del sistema de diseño anterior, alinearla de paso.
4. **No levantar preview/dev server** para validar cambios visuales — el usuario lo comprueba en producción y aporta capturas si hace falta. Basta con que compile (`npx tsc -b` / `npm run build`).
5. **Versionado**: en **cada prompt/comando ejecutado** hay que subir la versión. Incrementar en 1 el sufijo de `APP_VERSION` en `src/lib/version.ts` (v1.001 → v1.002 → v1.003…). Es lo primero o lo último de cada ejecución, siempre. La versión se muestra en pequeñito y gris a la derecha del logo `zafyros` en el sidebar.
6. **Changelog obligatorio**: cada vez que se sube la versión por un cambio real de código (feature, fix, ajuste visual…), hay que añadir una entrada en `CHANGELOG.md` bajo el epígrafe `## v1.XXX` correspondiente (una o varias líneas en bullet, en español, describiendo el cambio de cara al usuario). Va siempre junto al bump de versión, nunca como tarea aparte ni pospuesta. Los bumps que no correspondan a un cambio de código (p. ej. repetir una pregunta sin tocar archivos) no necesitan entrada. Además, siempre que se actualice `CHANGELOG.md` hay que incluir en la respuesta el enlace markdown al archivo (`[CHANGELOG.md](CHANGELOG.md)`) para que el usuario pueda abrirlo con un clic.
7. **Alerta de riesgo legal (IMPORTANTE)**: cualquier funcionalidad nueva o cambio a una existente que pueda tener implicación legal hay que señalarlo explícitamente en la respuesta, aunque no se pregunte — para que el usuario decida si hace falta actualizar los textos legales (`/aviso-legal`, `/privacidad`, y los que se añadan como `/cookies` o `/terminos`, en `src/i18n/locales/{es,en}/legal.json`). Dispara esta alerta, entre otros: nuevos datos personales recogidos o nuevos campos en `user_settings`/onboarding; nuevas integraciones o proveedores externos (analytics, pasarela de pago, nueva API bancaria…); cualquier tratamiento nuevo de los datos financieros del usuario (compartirlos, agregarlos, venderlos, usarlos para perfilado/segmentación); funcionalidades de cobro/suscripción; cambios en dónde o cómo se alojan los datos (región de Supabase, nuevo proveedor de hosting). No implica bloquear el desarrollo ni pedir permiso para avanzar — solo señalarlo con claridad para que se pueda actuar sobre los textos legales por separado. Ver `legal/aviso-legal.md` y memoria `project_legal_texts` para el estado y las decisiones ya tomadas sobre estos documentos.

## Comandos / setup

- Primer arranque: `npm install && npm run dev`.
- Supabase: ejecutar en orden `supabase/migrations/001_schema.sql` → `002_trigger.sql` → `003_community_rules.sql` → `004_keyword_rule_amount.sql` → `004_dashboard_aggregation.sql` → `005_account_logos.sql` → `006_account_type_valores.sql` → `007_bank_entities.sql` → `008_taxonomy_v2.sql` → `009_card_settlement_category.sql` → `010_opening_balance.sql` → `011_input_constraints.sql` → … → `018_security_linter_fixes.sql` → `019_user_bank_suggestions.sql` → `020_user_name_split.sql` → … → `030_bank_format_tax_fee_columns.sql` → `031_security_linter_fixes_2.sql` → `032_dictionary_rules.sql` → `033_rule_usage_counters.sql` + `supabase/seed.sql`, y rellenar `.env.local` con URL y anon key reales.
- Reset de datos de prueba (simular usuario nuevo): `supabase/reset_data.sql` en el SQL Editor de Supabase (conserva `auth.users`, `user_settings` y taxonomía de categorías).
- Build: `npm run build` (pasa solo con warning de tamaño de chunk >500kB).

## Gotchas ya resueltos (no reintroducir)

- `database.types.ts` debe declarar `Row/Insert/Update` como `type`, no `interface` (si no, supabase-js tipa los `.insert()/.update()` como `never`).
- `parseDate` en `useImport.ts`: cuidado con shadowear el `format` importado de date-fns con un parámetro del mismo nombre.
- `parseAmount` es locale-aware (detecta si `.`/`,` es decimal o millares); no asumir formato español fijo — los XLSX binarios renderizan decimales con punto.
- Los parsers de importación deben aplicar `detectHeaderRowIndex` (no solo el parser HTML-as-xls) para no tomar una fila de título como cabecera.
