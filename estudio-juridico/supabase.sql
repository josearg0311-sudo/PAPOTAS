-- =====================================================================
-- Estudio Rodríguez y Rodríguez · preparación de la nube (Supabase)
--
-- Cómo usarlo: en tu proyecto de Supabase entra a «SQL Editor», pega
-- este archivo entero y pulsa «Run». Se puede volver a ejecutar sin
-- romper nada.
--
-- Qué crea:
--   rr_miembros   quién puede entrar (por correo) y quién administra.
--   rr_registros  todos los datos del estudio, un registro por fila.
--   rr_unirme()   la primera persona que entra se vuelve administradora;
--                 las demás sólo entran si un administrador agregó su correo.
-- Nadie fuera de rr_miembros puede leer ni escribir nada (RLS).
-- =====================================================================

create table if not exists public.rr_miembros (
  email      text primary key,
  nombre     text,
  rol        text not null default 'Abogado',
  admin      boolean not null default false,
  creado     timestamptz not null default now()
);

create table if not exists public.rr_registros (
  coleccion   text        not null,
  id          text        not null,
  datos       jsonb       not null default '{}'::jsonb,
  borrado     boolean     not null default false,
  autor       text,
  actualizado timestamptz not null default clock_timestamp(),
  primary key (coleccion, id)
);
create index if not exists rr_registros_actualizado_idx on public.rr_registros (actualizado);

-- La hora la pone siempre el servidor: así todos los aparatos ordenan igual.
create or replace function public.rr_marcar_hora() returns trigger
language plpgsql as $$
begin
  new.actualizado := clock_timestamp();
  new.autor := coalesce(lower(auth.jwt() ->> 'email'), new.autor);
  return new;
end $$;
drop trigger if exists rr_registros_hora on public.rr_registros;
create trigger rr_registros_hora before insert or update on public.rr_registros
  for each row execute function public.rr_marcar_hora();

create or replace function public.rr_es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rr_miembros where email = lower(auth.jwt() ->> 'email'));
$$;
create or replace function public.rr_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rr_miembros where email = lower(auth.jwt() ->> 'email') and admin);
$$;

-- Entrar: devuelve tu ficha de miembro, o nada si no tienes acceso.
create or replace function public.rr_unirme(p_nombre text default null)
returns setof public.rr_miembros
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_email is null then return; end if;
  if not exists (select 1 from public.rr_miembros) then
    insert into public.rr_miembros (email, nombre, rol, admin) values (v_email, coalesce(p_nombre, v_email), 'Socio', true);
  end if;
  update public.rr_miembros set nombre = coalesce(nullif(p_nombre, ''), nombre) where email = v_email and (nombre is null or nombre = email);
  return query select * from public.rr_miembros where email = v_email;
end $$;

alter table public.rr_miembros  enable row level security;
alter table public.rr_registros enable row level security;

drop policy if exists rr_miembros_ver    on public.rr_miembros;
drop policy if exists rr_miembros_admin  on public.rr_miembros;
create policy rr_miembros_ver   on public.rr_miembros for select to authenticated using (public.rr_es_miembro());
create policy rr_miembros_admin on public.rr_miembros for all    to authenticated using (public.rr_es_admin()) with check (public.rr_es_admin() and email = lower(email));

drop policy if exists rr_registros_ver      on public.rr_registros;
drop policy if exists rr_registros_crear    on public.rr_registros;
drop policy if exists rr_registros_cambiar  on public.rr_registros;
create policy rr_registros_ver     on public.rr_registros for select to authenticated using (public.rr_es_miembro());
create policy rr_registros_crear   on public.rr_registros for insert to authenticated with check (public.rr_es_miembro());
create policy rr_registros_cambiar on public.rr_registros for update to authenticated using (public.rr_es_miembro()) with check (public.rr_es_miembro());
-- No hay política de borrado: lo eliminado se marca con borrado = true,
-- para que los demás aparatos se enteren.

revoke all on public.rr_miembros, public.rr_registros from anon;
grant select, insert, update, delete on public.rr_miembros to authenticated;
grant select, insert, update on public.rr_registros to authenticated;
grant execute on function public.rr_unirme(text) to authenticated;
