-- CAJA: sincronización entre dispositivos con un código secreto.
-- La tabla no se puede leer ni escribir directo (RLS sin políticas);
-- solo a través de las dos funciones, que exigen el código.
-- El código nunca se guarda: se guarda su huella SHA-256.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.caja_espacios (
  codigo_hash text primary key,
  datos jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  actualizado timestamptz not null default now()
);
alter table public.caja_espacios enable row level security;
revoke all on table public.caja_espacios from anon, authenticated;

create or replace function public.caja_leer(p_codigo text)
returns table (datos jsonb, version bigint)
language sql
security definer
set search_path = ''
as $$
  select e.datos, e.version
  from public.caja_espacios e
  where length(p_codigo) >= 20
    and e.codigo_hash = encode(extensions.digest(p_codigo, 'sha256'), 'hex');
$$;

-- Guarda solo si nadie cambió los datos desde la versión que el dispositivo leyó.
-- Devuelve la nueva versión, o null si hubo un cambio en otro dispositivo.
create or replace function public.caja_guardar(p_codigo text, p_datos jsonb, p_version bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text;
  v bigint;
begin
  if length(p_codigo) < 20 then raise exception 'codigo invalido'; end if;
  if octet_length(p_datos::text) > 2000000 then raise exception 'datos demasiado grandes'; end if;
  h := encode(extensions.digest(p_codigo, 'sha256'), 'hex');
  insert into public.caja_espacios as e (codigo_hash, datos, version)
  values (h, p_datos, 1)
  on conflict (codigo_hash) do update
    set datos = excluded.datos, version = e.version + 1, actualizado = now()
    where e.version = p_version
  returning e.version into v;
  return v;
end;
$$;

revoke all on function public.caja_leer(text) from public;
revoke all on function public.caja_guardar(text, jsonb, bigint) from public;
grant execute on function public.caja_leer(text) to anon, authenticated;
grant execute on function public.caja_guardar(text, jsonb, bigint) to anon, authenticated;
