# Informe de auditoría RLS — Fase 0 (Arquitectura de administración)

Fecha: 2026-07-09 · Migración asociada: `015_admin_role.sql`

Objetivo: auditar tabla por tabla el estado de Row Level Security, cerrar los
agujeros y dejar el backend en **deny-by-default** (RLS activada + sin política
permisiva = denegado). No se construyen pantallas de admin; solo la seguridad de
debajo. La autorización real vive en RLS (backend Supabase, sin servidor propio),
no en el frontend.

## Modelo de roles

- Rol simple con booleano `user_settings.is_admin` (NOT NULL DEFAULT false).
  Diseñado para migrar a roles múltiples/RBAC en el futuro sin rehacer políticas.
- Función `public.is_admin()` `SECURITY DEFINER STABLE` que lee el flag del
  usuario actual **saltándose la RLS**. Es crítico para poder usarla dentro de
  las políticas sin recursión infinita (leer `user_settings` en su propia
  política sin `SECURITY DEFINER` recurriría).

## Clasificación de tablas

- **Datos de usuario**: acceso restringido a `auth.uid()`.
- **Catálogos globales**: SELECT para autenticados; INSERT/UPDATE/DELETE solo `is_admin()`.

## Auditoría tabla por tabla

| Tabla | Clasificación | RLS | Estado previo | Acción (015) | Estado final |
|---|---|---|---|---|---|
| `user_settings` | Usuario | ✅ | `own_settings` FOR ALL `user_id = auth.uid()` | Sin cambios (+ columna `is_admin`) | Acotado a `auth.uid()` ✅ |
| `financial_profiles` | Usuario | ✅ | `own_profiles` FOR ALL `user_id = auth.uid()` | Sin cambios | Acotado a `auth.uid()` ✅ |
| `accounts` | Usuario | ✅ | `own_accounts` vía perfil del usuario | Sin cambios | Acotado ✅ |
| `transactions` | Usuario | ✅ | `own_transactions` vía perfil del usuario | Sin cambios | Acotado ✅ |
| `import_batches` | Usuario | ✅ | `own_import_batches` vía perfil | Sin cambios | Acotado ✅ |
| `bank_formats` | Usuario | ✅ | `own_bank_formats` `user_id = auth.uid()` | Sin cambios | Acotado ✅ |
| `keyword_rules` | Usuario | ✅ | `own_keyword_rules` `user_id = auth.uid()` | Sin cambios | Acotado ✅ |
| `community_rule_contributions` | Usuario | ✅ | SELECT propio; escritura solo vía funciones `SECURITY DEFINER` | Sin cambios | Acotado ✅ |
| `community_rules` | Catálogo (agregado) | ✅ | SELECT `authenticated`; sin escritura directa (deny-by-default) | Sin cambios | Lectura auth, escritura denegada ✅ |
| `category_groups` | Catálogo global | ✅ | SELECT `USING(true)` (**público, incluso sin login**); sin escritura | Lectura → `TO authenticated`; escritura → `is_admin()` | Lectura auth, escritura admin ✅ |
| `categories` | Catálogo global | ✅ | SELECT `USING(true)` (**público, incluso sin login**); sin escritura | Lectura → `TO authenticated`; escritura → `is_admin()` | Lectura auth, escritura admin ✅ |
| `bank_entities` | Catálogo global | ✅ | **AGUJERO**: `bank_entities write` FOR ALL `authenticated USING(true)` → cualquier autenticado escribía | DROP política abierta; INSERT/UPDATE/DELETE → `is_admin()`; lectura auth | Lectura auth, escritura admin ✅ |
| `v_monthly_summary_by_profile` (vista) | — | ⚠️ | **FUGA**: vista sin `security_invoker` → se saltaba la RLS de `transactions`; cualquier autenticado leía agregados de **todos** los usuarios. Código muerto (no usada por el frontend) | `DROP VIEW` | Eliminada ✅ |
| `v_dashboard_totals` / `v_dashboard_breakdown` (vistas) | — | ✅ | `security_invoker = true` (respetan RLS de `transactions`) | Sin cambios | Correctas ✅ |
| `storage.objects` (bucket `account-logos`) | Usuario | ✅ | Lectura pública; escritura acotada al perfil del dueño (migración 011) | Sin cambios | Correcto ✅ |

## Agujeros cerrados

1. `bank_entities`: escritura abierta a cualquier autenticado → **solo `is_admin()`**.
2. `v_monthly_summary_by_profile`: fuga cross-usuario por vista sin `security_invoker` → **eliminada**.
3. `categories` / `category_groups`: lectura pública sin login → **restringida a autenticados**; y escritura ahora explícita bajo `is_admin()`.

## Criterio de aceptación (prueba de fuego)

Con una cuenta de prueba normal usando la anon key pública directamente contra
PostgREST (saltándose la interfaz):

- **No** puede leer filas de otro usuario: todas las tablas de datos de usuario
  filtran por `auth.uid()` (directa o vía perfil). La vista con fuga se eliminó.
- **No** puede escribir en catálogos globales: `bank_entities`, `categories` y
  `category_groups` exigen `is_admin()` para INSERT/UPDATE/DELETE; `community_rules`
  no tiene política de escritura (denegada por defecto).

## Pasos manuales pendientes (owner)

1. Ejecutar `015_admin_role.sql` en el SQL Editor de Supabase.
2. Descomentar y ejecutar el `UPDATE ... SET is_admin = true` para
   `alex.delaguila83@gmail.com` (requiere que la fila de `user_settings` exista;
   se crea al iniciar sesión esa cuenta al menos una vez).
