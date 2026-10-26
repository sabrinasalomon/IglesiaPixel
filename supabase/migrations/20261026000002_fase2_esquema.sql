-- Fase 2: ministerios, eventos, asistencia y comunicados.
-- Igual que en la Fase 1, las reglas de acceso viven en la base de datos (RLS):
--   ministerios: administrador; pastor y secretario de la sede los gestionan;
--                el coordinador administra los integrantes del suyo
--   eventos:     los ve toda la sede; los gestionan administrador, pastor y
--                secretario; el coordinador, los de su ministerio
--   asistencia:  la pasa quien puede gestionar el evento
--   comunicados: los publican administrador (cualquier sede o todas), pastor y
--                secretario (su sede); los ve toda la sede cuando ya se publicaron

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.ministerios (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes (id) on delete restrict,
  nombre text not null check (length(trim(nombre)) > 0),
  descripcion text not null default '',
  coordinador_id uuid references public.miembros (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index ministerios_sede_idx on public.ministerios (sede_id);

create table public.ministerio_integrantes (
  ministerio_id uuid not null references public.ministerios (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id) on delete cascade,
  primary key (ministerio_id, miembro_id)
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes (id) on delete restrict,
  ministerio_id uuid references public.ministerios (id) on delete set null,
  titulo text not null check (length(trim(titulo)) > 0),
  tipo text not null check (tipo in (
    'Culto dominical', 'Culto de oración', 'Estudio bíblico', 'Reunión de ministerio',
    'Reunión administrativa', 'Actividad especial', 'Evangelismo'
  )),
  fecha date not null,
  hora time not null,
  lugar text not null default '',
  descripcion text not null default '',
  cancelado boolean not null default false, -- no se borran: se cancelan
  creado_en timestamptz not null default now()
);
create index eventos_sede_fecha_idx on public.eventos (sede_id, fecha);

create table public.evento_responsables (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id) on delete cascade,
  primary key (evento_id, miembro_id)
);

create table public.asistencias (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id) on delete cascade,
  presente boolean not null,
  registrado_por uuid references public.usuarios (id) on delete set null default auth.uid(),
  registrado_en timestamptz not null default now(),
  primary key (evento_id, miembro_id)
);

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid references public.sedes (id) on delete cascade, -- null = todas las sedes
  titulo text not null check (length(trim(titulo)) > 0),
  contenido text not null default '',
  fecha_publicacion date not null default current_date,
  importante boolean not null default false,
  autor_id uuid references public.usuarios (id) on delete set null,
  autor_nombre text not null default '',
  creado_en timestamptz not null default now()
);
create index anuncios_sede_idx on public.anuncios (sede_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares para las políticas
-- ---------------------------------------------------------------------------

-- Administrador, o pastor/secretario de esa sede
create function public.gestiona_sede(p_sede uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_admin()
    or coalesce(p_sede = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario'), false)
$$;

-- El usuario es el coordinador (rol Coordinador) de ese ministerio
create function public.coordina(p_ministerio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.mi_rol() = 'coordinador' and exists (
    select 1 from public.ministerios
    where id = p_ministerio and coordinador_id = public.mi_miembro() and sede_id = public.mi_sede()
  )
$$;

create function public.miembro_en_sede(p_miembro uuid, p_sede uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.miembros where id = p_miembro and sede_id = p_sede)
$$;

create function public.ministerio_en_sede(p_ministerio uuid, p_sede uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ministerios where id = p_ministerio and sede_id = p_sede)
$$;

create function public.puede_gestionar_ministerio(p_ministerio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ministerios m
    where m.id = p_ministerio and (public.gestiona_sede(m.sede_id) or public.coordina(m.id))
  )
$$;

create function public.puede_gestionar_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.eventos e
    where e.id = p_evento
      and (public.gestiona_sede(e.sede_id) or (e.ministerio_id is not null and public.coordina(e.ministerio_id)))
  )
$$;

-- El integrante, responsable o asistente debe ser de la misma sede
create function public.miembro_de_ministerio_ok(p_ministerio uuid, p_miembro uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ministerios m
    join public.miembros x on x.sede_id = m.sede_id
    where m.id = p_ministerio and x.id = p_miembro
  )
$$;

create function public.miembro_de_evento_ok(p_evento uuid, p_miembro uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.eventos e
    join public.miembros x on x.sede_id = e.sede_id
    where e.id = p_evento and x.id = p_miembro
  )
$$;

-- El autor de un anuncio lo pone la base de datos, no quien lo envía
create function public.firmar_anuncio() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.autor_id := auth.uid();
    new.autor_nombre := coalesce((select nombre from public.usuarios where id = auth.uid()), '');
  end if;
  return new;
end;
$$;

create trigger anuncios_firmar
  before insert on public.anuncios
  for each row execute function public.firmar_anuncio();

-- ---------------------------------------------------------------------------
-- Permisos de tabla (RLS decide qué filas)
-- ---------------------------------------------------------------------------

grant select, insert, update on public.ministerios, public.eventos to authenticated;
grant select, insert, delete on public.ministerio_integrantes, public.evento_responsables to authenticated;
grant select, insert, update, delete on public.asistencias to authenticated;
grant select, insert, delete on public.anuncios to authenticated;
grant update (sede_id, titulo, contenido, fecha_publicacion, importante) on public.anuncios to authenticated;
grant execute on function
  public.gestiona_sede(uuid), public.coordina(uuid), public.miembro_en_sede(uuid, uuid),
  public.ministerio_en_sede(uuid, uuid), public.puede_gestionar_ministerio(uuid),
  public.puede_gestionar_evento(uuid), public.miembro_de_ministerio_ok(uuid, uuid),
  public.miembro_de_evento_ok(uuid, uuid)
  to authenticated;

alter table public.ministerios enable row level security;
alter table public.ministerio_integrantes enable row level security;
alter table public.eventos enable row level security;
alter table public.evento_responsables enable row level security;
alter table public.asistencias enable row level security;
alter table public.anuncios enable row level security;

-- Ministerios: los ve el personal de la sede; los crean y editan administrador,
-- pastor y secretario. El coordinador no cambia los datos del ministerio,
-- solo sus integrantes.
create policy ministerios_ver on public.ministerios for select to authenticated
  using (
    public.es_admin()
    or (sede_id = public.mi_sede() and public.mi_rol() in ('pastor', 'secretario', 'tesorero', 'coordinador'))
  );
create policy ministerios_crear on public.ministerios for insert to authenticated
  with check (
    public.gestiona_sede(sede_id)
    and (coordinador_id is null or public.miembro_en_sede(coordinador_id, sede_id))
  );
create policy ministerios_editar on public.ministerios for update to authenticated
  using (public.gestiona_sede(sede_id))
  with check (
    public.gestiona_sede(sede_id)
    and (coordinador_id is null or public.miembro_en_sede(coordinador_id, sede_id))
  );

create policy integrantes_ver on public.ministerio_integrantes for select to authenticated
  using (exists (select 1 from public.ministerios m where m.id = ministerio_id));
create policy integrantes_agregar on public.ministerio_integrantes for insert to authenticated
  with check (
    public.puede_gestionar_ministerio(ministerio_id)
    and public.miembro_de_ministerio_ok(ministerio_id, miembro_id)
  );
create policy integrantes_quitar on public.ministerio_integrantes for delete to authenticated
  using (public.puede_gestionar_ministerio(ministerio_id));

-- Eventos: toda la sede los ve (incluido el rol Miembro)
create policy eventos_ver on public.eventos for select to authenticated
  using (public.es_admin() or sede_id = public.mi_sede());
create policy eventos_crear on public.eventos for insert to authenticated
  with check (
    (public.gestiona_sede(sede_id) or (ministerio_id is not null and public.coordina(ministerio_id)))
    and (ministerio_id is null or public.ministerio_en_sede(ministerio_id, sede_id))
  );
create policy eventos_editar on public.eventos for update to authenticated
  using (public.gestiona_sede(sede_id) or (ministerio_id is not null and public.coordina(ministerio_id)))
  with check (
    (public.gestiona_sede(sede_id) or (ministerio_id is not null and public.coordina(ministerio_id)))
    and (ministerio_id is null or public.ministerio_en_sede(ministerio_id, sede_id))
  );

create policy responsables_ver on public.evento_responsables for select to authenticated
  using (exists (select 1 from public.eventos e where e.id = evento_id));
create policy responsables_agregar on public.evento_responsables for insert to authenticated
  with check (public.puede_gestionar_evento(evento_id) and public.miembro_de_evento_ok(evento_id, miembro_id));
create policy responsables_quitar on public.evento_responsables for delete to authenticated
  using (public.puede_gestionar_evento(evento_id));

-- Asistencia: la ve y la registra quien gestiona el evento
create policy asistencias_ver on public.asistencias for select to authenticated
  using (public.puede_gestionar_evento(evento_id));
create policy asistencias_registrar on public.asistencias for insert to authenticated
  with check (public.puede_gestionar_evento(evento_id) and public.miembro_de_evento_ok(evento_id, miembro_id));
create policy asistencias_corregir on public.asistencias for update to authenticated
  using (public.puede_gestionar_evento(evento_id))
  with check (public.puede_gestionar_evento(evento_id) and public.miembro_de_evento_ok(evento_id, miembro_id));
create policy asistencias_borrar on public.asistencias for delete to authenticated
  using (public.puede_gestionar_evento(evento_id));

-- Comunicados: los programados (fecha futura) solo los ve quien los gestiona
create policy anuncios_ver on public.anuncios for select to authenticated
  using (
    public.es_admin()
    or (
      public.mi_rol() is not null
      and (sede_id is null or sede_id = public.mi_sede())
      and (fecha_publicacion <= current_date or public.gestiona_sede(public.mi_sede()))
    )
  );
create policy anuncios_crear on public.anuncios for insert to authenticated
  with check (public.gestiona_sede(sede_id));
create policy anuncios_editar on public.anuncios for update to authenticated
  using (public.gestiona_sede(sede_id)) with check (public.gestiona_sede(sede_id));
create policy anuncios_borrar on public.anuncios for delete to authenticated
  using (public.gestiona_sede(sede_id));
