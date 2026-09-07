-- PAPOTAS · preparación de Supabase. Pégalo entero en SQL Editor y ejecútalo.

create table if not exists public.papotas_sync_records (
  coleccion       text        not null,
  registro_id     text        not null,
  datos           jsonb       not null default '{}'::jsonb,
  eliminado       boolean     not null default false,
  dispositivo_id  text,
  version         bigint      not null default 1,
  actualizado_en  timestamptz not null default now(),
  primary key (coleccion, registro_id)
);

create index if not exists papotas_sync_records_actualizado_idx
  on public.papotas_sync_records (actualizado_en);

create or replace function public.papotas_upsert_record(
  p_coleccion text, p_registro_id text, p_datos jsonb, p_dispositivo_id text
) returns void language sql security definer as $$
  insert into public.papotas_sync_records as t
    (coleccion, registro_id, datos, eliminado, dispositivo_id, version, actualizado_en)
  values (p_coleccion, p_registro_id, p_datos, false, p_dispositivo_id, 1, now())
  on conflict (coleccion, registro_id) do update set
    datos = excluded.datos,
    eliminado = false,
    dispositivo_id = excluded.dispositivo_id,
    version = t.version + 1,
    actualizado_en = now();
$$;

create or replace function public.papotas_delete_record(
  p_coleccion text, p_registro_id text, p_dispositivo_id text
) returns void language sql security definer as $$
  insert into public.papotas_sync_records as t
    (coleccion, registro_id, datos, eliminado, dispositivo_id, version, actualizado_en)
  values (p_coleccion, p_registro_id, '{}'::jsonb, true, p_dispositivo_id, 1, now())
  on conflict (coleccion, registro_id) do update set
    eliminado = true,
    dispositivo_id = excluded.dispositivo_id,
    version = t.version + 1,
    actualizado_en = now();
$$;

-- Acceso con la clave pública (anon). Si esta base solo la usas tú, vale.
-- Si vas a compartirla, cambia estas reglas por algo más estricto.
alter table public.papotas_sync_records enable row level security;
drop policy if exists papotas_anon_todo on public.papotas_sync_records;
create policy papotas_anon_todo on public.papotas_sync_records
  for all to anon using (true) with check (true);
grant usage on schema public to anon;
grant select, insert, update, delete on public.papotas_sync_records to anon;
grant execute on function public.papotas_upsert_record(text,text,jsonb,text) to anon;
grant execute on function public.papotas_delete_record(text,text,text) to anon;

-- Para que los cambios lleguen al instante a los demás dispositivos.
-- (Si ya estaba publicada, no pasa nada: se puede ejecutar las veces que haga falta.)
do $do$
begin
  alter publication supabase_realtime add table public.papotas_sync_records;
exception when duplicate_object then null;
end
$do$;
