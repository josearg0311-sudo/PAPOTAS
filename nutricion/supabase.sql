-- Kallpa · preparación de Supabase.
-- Pégalo entero en SQL Editor y pulsa Run. Puede ser el mismo proyecto de PAPOTAS.
--
-- Los datos de cada familia se guardan en filas separadas por un «código de familia»
-- largo y secreto. La tabla no se puede leer directamente con la clave pública:
-- solo a través de estas dos funciones, que exigen ese código.

create table if not exists public.kallpa_datos (
  familia        text        not null,
  clave          text        not null,
  datos          jsonb       not null,
  ts             bigint      not null,
  actualizado_en timestamptz not null default now(),
  primary key (familia, clave)
);

alter table public.kallpa_datos enable row level security;
revoke all on public.kallpa_datos from anon, authenticated;

create or replace function public.kallpa_guardar(p_familia text, p_clave text, p_datos jsonb, p_ts bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_familia) < 16 then raise exception 'codigo de familia demasiado corto'; end if;
  insert into kallpa_datos (familia, clave, datos, ts) values (p_familia, p_clave, p_datos, p_ts)
  on conflict (familia, clave) do update
    set datos = excluded.datos, ts = excluded.ts, actualizado_en = now()
    where kallpa_datos.ts < excluded.ts;
end $$;

create or replace function public.kallpa_leer(p_familia text, p_desde bigint)
returns table (clave text, datos jsonb, ts bigint, srv bigint)
language sql stable security definer set search_path = public as $$
  select clave, datos, ts, (extract(epoch from actualizado_en) * 1000)::bigint
  from kallpa_datos
  where familia = p_familia and length(p_familia) >= 16
    and actualizado_en > to_timestamp(p_desde / 1000.0);
$$;

grant execute on function public.kallpa_guardar(text, text, jsonb, bigint) to anon;
grant execute on function public.kallpa_leer(text, bigint) to anon;
