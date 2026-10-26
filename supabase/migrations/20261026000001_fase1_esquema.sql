-- Fase 1: sedes, usuarios con rol, miembros, configuración de la iglesia y horarios.
-- La seguridad se aplica en la base de datos con Row Level Security (RLS):
-- cada usuario solo ve y modifica los datos que su rol y su sede permiten,
-- aunque alguien llame a la API directamente sin pasar por la aplicación.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.rol as enum (
  'administrador', 'pastor', 'secretario', 'tesorero', 'coordinador', 'miembro'
);

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  direccion text not null default '',
  telefono text not null default '',
  correo text not null default '',
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.miembros (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes (id) on delete restrict,
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text not null default '',
  correo text not null default '',
  fecha_ingreso date not null default current_date,
  activo boolean not null default true, -- baja lógica: nunca se borra
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index miembros_sede_idx on public.miembros (sede_id);

-- Perfil de cada cuenta de acceso (una fila por usuario de auth.users)
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  correo text not null,
  rol public.rol not null default 'miembro',
  sede_id uuid references public.sedes (id) on delete set null,
  miembro_id uuid references public.miembros (id) on delete set null,
  activo boolean not null default false,
  creado_en timestamptz not null default now()
);

-- Registro único con los datos institucionales
create table public.configuracion_iglesia (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'Mi iglesia',
  lema text not null default '',
  logo_url text
);
insert into public.configuracion_iglesia (id) values (1);

create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes (id) on delete cascade,
  dia text not null check (dia in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  hora time not null,
  tipo text not null check (length(trim(tipo)) > 0)
);
create index horarios_sede_idx on public.horarios (sede_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares para las políticas
-- (security definer para leer el perfil sin depender de las políticas de usuarios)
-- ---------------------------------------------------------------------------

create function public.mi_rol() returns public.rol
language sql stable security definer set search_path = '' as $$
  select rol from public.usuarios where id = auth.uid() and activo
$$;

create function public.mi_sede() returns uuid
language sql stable security definer set search_path = '' as $$
  select sede_id from public.usuarios where id = auth.uid() and activo
$$;

create function public.mi_miembro() returns uuid
language sql stable security definer set search_path = '' as $$
  select miembro_id from public.usuarios where id = auth.uid() and activo
$$;

create function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.mi_rol() = 'administrador', false)
$$;

-- ---------------------------------------------------------------------------
-- Alta automática del perfil al crear una cuenta
-- La primera cuenta del sistema queda como administrador activo. Las demás
-- nacen inactivas y sin permisos hasta que un administrador les asigna rol y
-- sede (la invitación desde la aplicación lo hace en el mismo paso).
-- ---------------------------------------------------------------------------

create function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  primera boolean := not exists (select 1 from public.usuarios);
begin
  insert into public.usuarios (id, correo, nombre, rol, activo, sede_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    case when primera then 'administrador'::public.rol else 'miembro'::public.rol end,
    primera,
    case when primera then (select id from public.sedes order by creado_en limit 1) end
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

create function public.marcar_actualizado() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger miembros_actualizado
  before update on public.miembros
  for each row execute function public.marcar_actualizado();

-- ---------------------------------------------------------------------------
-- Permisos de tabla (RLS decide qué filas)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.configuracion_iglesia to anon;
grant select, insert, update on public.sedes, public.miembros, public.horarios to authenticated;
grant select, update on public.usuarios, public.configuracion_iglesia to authenticated;
grant delete on public.horarios to authenticated;
grant execute on function public.mi_rol(), public.mi_sede(), public.mi_miembro(), public.es_admin() to authenticated;

alter table public.sedes enable row level security;
alter table public.miembros enable row level security;
alter table public.usuarios enable row level security;
alter table public.configuracion_iglesia enable row level security;
alter table public.horarios enable row level security;

-- Sedes: cualquier usuario activo las ve; solo el administrador las gestiona
create policy sedes_ver on public.sedes for select to authenticated
  using (public.mi_rol() is not null);
create policy sedes_crear on public.sedes for insert to authenticated
  with check (public.es_admin());
create policy sedes_editar on public.sedes for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Configuración: el nombre y logo se muestran en la pantalla de inicio de sesión
create policy configuracion_ver on public.configuracion_iglesia for select to anon, authenticated
  using (true);
create policy configuracion_editar on public.configuracion_iglesia for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Horarios: los ve la sede (y el administrador); los gestiona el administrador
create policy horarios_ver on public.horarios for select to authenticated
  using (public.es_admin() or sede_id = public.mi_sede());
create policy horarios_crear on public.horarios for insert to authenticated
  with check (public.es_admin());
create policy horarios_borrar on public.horarios for delete to authenticated
  using (public.es_admin());

-- Usuarios: cada quien ve su perfil; el pastor ve los de su sede; el
-- administrador ve y edita todos. Nadie puede cambiarse su propio rol.
create policy usuarios_ver on public.usuarios for select to authenticated
  using (
    id = auth.uid()
    or public.es_admin()
    or (public.mi_rol() = 'pastor' and sede_id = public.mi_sede())
  );
create policy usuarios_editar on public.usuarios for update to authenticated
  using (public.es_admin() and id <> auth.uid())
  with check (public.es_admin());

-- Miembros:
--   ver: administrador (todas las sedes); pastor, secretario, tesorero y
--        coordinador (su sede); un miembro solo su propio registro
--   crear y editar: administrador; pastor y secretario en su sede
--   borrar: nadie (se desactivan)
create policy miembros_ver on public.miembros for select to authenticated
  using (
    public.es_admin()
    or (sede_id = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario', 'tesorero', 'coordinador'))
    or id = public.mi_miembro()
  );
create policy miembros_crear on public.miembros for insert to authenticated
  with check (
    public.es_admin()
    or (sede_id = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario'))
  );
create policy miembros_editar on public.miembros for update to authenticated
  using (
    public.es_admin()
    or (sede_id = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario'))
  )
  with check (
    public.es_admin()
    or (sede_id = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario'))
  );

-- ---------------------------------------------------------------------------
-- Logotipo: bucket público de solo lectura; solo el administrador sube archivos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy logos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.es_admin());
create policy logos_reemplazar on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.es_admin());
