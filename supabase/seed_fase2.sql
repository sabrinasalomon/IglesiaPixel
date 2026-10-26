-- Datos de ejemplo de la Fase 2 (opcional): ministerios, eventos, asistencia y
-- anuncios. Requiere los datos de ejemplo de la Fase 1 (seed.sql).
-- Las fechas se calculan a partir del día en que se ejecuta.

-- Ministerios con su coordinador e integrantes
with datos (sede, nombre, descripcion, coordinador, integrantes) as (values
  ('Sede Centro', 'Música y alabanza', 'Dirige la alabanza en cultos y eventos.', 'María Hernández López',
    array['María Hernández López', 'José García Martínez', 'Rosa Morales Vázquez']),
  ('Sede Centro', 'Jóvenes', 'Actividades y estudio para jóvenes de 15 a 29 años.', 'Juan Pérez Flores',
    array['Juan Pérez Flores', 'Ana Sánchez Gómez', 'Rosa Morales Vázquez']),
  ('Sede Centro', 'Servicio', 'Ujieres, limpieza, logística y apoyo social.', 'Guadalupe Ramírez Cruz',
    array['Guadalupe Ramírez Cruz', 'José García Martínez']),
  ('Sede Norte', 'Música y alabanza', 'Dirige la alabanza en cultos y eventos.', 'Laura Mendoza Ruiz',
    array['Laura Mendoza Ruiz', 'Carlos Reyes Jiménez']),
  ('Sede Norte', 'Jóvenes', 'Actividades y estudio para jóvenes de 15 a 29 años.', 'Miguel González Pérez',
    array['Miguel González Pérez']),
  ('Sede Occidente', 'Enseñanza', 'Estudios bíblicos y discipulado.', 'Patricia Cruz Hernández',
    array['Patricia Cruz Hernández', 'Jorge Flores Torres'])
),
nuevos as (
  insert into public.ministerios (sede_id, nombre, descripcion, coordinador_id)
  select s.id, d.nombre, d.descripcion, (select id from public.miembros where nombre = d.coordinador)
  from datos d join public.sedes s on s.nombre = d.sede
  returning id, sede_id, nombre
)
insert into public.ministerio_integrantes (ministerio_id, miembro_id)
select n.id, m.id
from nuevos n
join public.sedes s on s.id = n.sede_id
join datos d on d.sede = s.nombre and d.nombre = n.nombre
join public.miembros m on m.nombre = any (d.integrantes);

-- Cultos semanales de las últimas 6 semanas y las próximas 4 en cada sede,
-- y una reunión de ministerio cada sábado (rotando entre los ministerios)
with semanas as (
  select (current_date - extract(dow from current_date)::int + 7 * w) as domingo, w
  from generate_series(-6, 4) as w
)
insert into public.eventos (sede_id, ministerio_id, titulo, tipo, fecha, hora, lugar, descripcion)
select s.id, null::uuid, 'Culto dominical', 'Culto dominical', domingo, '10:00'::time, 'Templo principal',
       'Culto general de adoración y predicación.'
from public.sedes s cross join semanas
union all
select s.id, null, 'Culto de oración', 'Culto de oración', domingo + 3, '19:00'::time, 'Salón de oración',
       'Reunión de oración entre semana.'
from public.sedes s cross join semanas
union all
select m.sede_id, m.id, 'Reunión de ' || m.nombre, 'Reunión de ministerio', domingo + 6, '17:00'::time, 'Aula 2',
       'Reunión del ministerio de ' || lower(m.nombre) || '.'
from semanas
join lateral (
  select mi.*, row_number() over (partition by mi.sede_id order by mi.nombre) - 1 as n,
         count(*) over (partition by mi.sede_id) as total
  from public.ministerios mi
) m on (semanas.w + 6) % m.total = m.n;

-- Eventos especiales
insert into public.eventos (sede_id, ministerio_id, titulo, tipo, fecha, hora, lugar, descripcion)
select s.id, (select id from public.ministerios where sede_id = s.id and nombre = 'Jóvenes'),
       'Retiro de jóvenes', 'Actividad especial', current_date + 12, '08:00'::time, 'Campamento Las Cumbres',
       'Retiro de fin de semana con alabanza, talleres y convivencia.'
from public.sedes s where s.nombre = 'Sede Centro'
union all
select s.id, null::uuid, 'Junta administrativa', 'Reunión administrativa', current_date + 5, '18:30'::time, 'Oficina pastoral',
       'Revisión de actividades del mes y presupuesto.'
from public.sedes s;

-- Responsables: el coordinador en las reuniones de ministerio; en los cultos,
-- el miembro activo más antiguo de la sede
insert into public.evento_responsables (evento_id, miembro_id)
select e.id, coalesce(
  (select coordinador_id from public.ministerios where id = e.ministerio_id),
  (select id from public.miembros where sede_id = e.sede_id and activo order by fecha_ingreso limit 1)
)
from public.eventos e;

-- Asistencia de los eventos ya pasados (convocados: integrantes del ministerio
-- o todos los miembros activos de la sede)
insert into public.asistencias (evento_id, miembro_id, presente)
select e.id, m.id, random() < case when e.tipo = 'Culto dominical' then 0.85 else 0.65 end
from public.eventos e
join public.miembros m on m.sede_id = e.sede_id and m.activo
where e.fecha < current_date
  and (e.ministerio_id is null
       or exists (select 1 from public.ministerio_integrantes i where i.ministerio_id = e.ministerio_id and i.miembro_id = m.id));

-- Anuncios
insert into public.anuncios (sede_id, titulo, contenido, fecha_publicacion, importante, autor_nombre) values
  (null, 'Aniversario de la iglesia',
   'Celebraremos nuestro 25 aniversario con un culto unido de todas las sedes. ¡No faltes!',
   current_date - 2, true, 'Administración'),
  ('11111111-0000-4000-8000-000000000001', 'Inscripciones abiertas para el retiro de jóvenes',
   'Aparta tu lugar con el coordinador de jóvenes antes del viernes. Cupo limitado a 60 personas.',
   current_date - 4, false, 'Secretaría Sede Centro'),
  ('11111111-0000-4000-8000-000000000001', 'Colecta de víveres',
   'Durante todo el mes recibiremos despensa para familias de la colonia. Entrega en la recepción.',
   current_date - 9, false, 'Secretaría Sede Centro'),
  ('11111111-0000-4000-8000-000000000002', 'Cambio de horario del culto de oración',
   'A partir de este mes el culto de oración será a las 19:30.',
   current_date - 6, true, 'Administración');
