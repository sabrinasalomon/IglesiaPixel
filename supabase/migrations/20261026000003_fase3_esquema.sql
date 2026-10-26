-- Fase 3: donaciones y aportaciones.
-- La información financiera solo la ven el administrador, el pastor y el
-- tesorero de la sede; solo el administrador y el tesorero registran. Las
-- aportaciones no se borran ni se editan: si hubo un error se anulan y se
-- registran de nuevo, para que quede rastro.

create table public.aportaciones (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes (id) on delete restrict,
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  concepto text not null check (concepto in (
    'Diezmo', 'Ofrenda', 'Primicias', 'Donativo especial', 'Misiones', 'Construcción', 'Otro'
  )),
  metodo text not null check (metodo in (
    'Efectivo', 'Transferencia SPEI', 'Tarjeta', 'Depósito bancario', 'Cheque'
  )),
  miembro_id uuid references public.miembros (id) on delete set null, -- vacío = anónima
  registrado_por uuid references public.usuarios (id) on delete set null,
  anulada boolean not null default false,
  creado_en timestamptz not null default now()
);
create index aportaciones_sede_fecha_idx on public.aportaciones (sede_id, fecha);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------------

create function public.ve_finanzas(p_sede uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_admin()
    or coalesce(p_sede = public.mi_sede() and public.mi_rol() in ('pastor', 'tesorero'), false)
$$;

create function public.registra_finanzas(p_sede uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_admin()
    or coalesce(p_sede = public.mi_sede() and public.mi_rol() = 'tesorero', false)
$$;

-- Quien registra lo pone la base de datos
create function public.firmar_aportacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.registrado_por := auth.uid();
  end if;
  return new;
end;
$$;

create trigger aportaciones_firmar
  before insert on public.aportaciones
  for each row execute function public.firmar_aportacion();

-- ---------------------------------------------------------------------------
-- Permisos (RLS decide qué filas)
-- ---------------------------------------------------------------------------

grant select, insert on public.aportaciones to authenticated;
grant update (anulada) on public.aportaciones to authenticated;
grant execute on function public.ve_finanzas(uuid), public.registra_finanzas(uuid) to authenticated;

alter table public.aportaciones enable row level security;

create policy aportaciones_ver on public.aportaciones for select to authenticated
  using (public.ve_finanzas(sede_id));
create policy aportaciones_registrar on public.aportaciones for insert to authenticated
  with check (
    public.registra_finanzas(sede_id)
    and not anulada
    and (miembro_id is null or public.miembro_en_sede(miembro_id, sede_id))
  );
create policy aportaciones_anular on public.aportaciones for update to authenticated
  using (public.registra_finanzas(sede_id)) with check (public.registra_finanzas(sede_id));
