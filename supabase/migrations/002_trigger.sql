-- ============================================================
-- FinTrack — Trigger: crear user_settings al registrarse
-- Ejecutar en una query SEPARADA después de 001_schema.sql
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into user_settings (user_id, preferred_language)
  values (new.id, 'es')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
