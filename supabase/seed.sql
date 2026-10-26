-- Datos de ejemplo para el proyecto académico (opcional).
-- Ejecutar DESPUÉS de la migración y ANTES de crear la primera cuenta, para
-- que el administrador quede asignado a la Sede Centro.

update public.configuracion_iglesia
set nombre = 'Iglesia Comunidad de Fe', lema = 'Una familia, muchas sedes'
where id = 1;

insert into public.sedes (id, nombre, direccion, telefono, correo, creado_en) values
  ('11111111-0000-4000-8000-000000000001', 'Sede Centro', 'Av. Juárez 120, Centro, Ciudad de México', '55 5512 3400', 'centro@comunidaddefe.mx', now() - interval '3 minutes'),
  ('11111111-0000-4000-8000-000000000002', 'Sede Norte', 'Calle Morelos 845, Monterrey, N.L.', '81 8340 2200', 'norte@comunidaddefe.mx', now() - interval '2 minutes'),
  ('11111111-0000-4000-8000-000000000003', 'Sede Occidente', 'Av. Vallarta 3100, Guadalajara, Jal.', '33 3615 7800', 'occidente@comunidaddefe.mx', now() - interval '1 minute');

insert into public.horarios (sede_id, dia, hora, tipo)
select s.id, h.dia, h.hora::time, h.tipo
from public.sedes s
cross join (values
  ('Domingo', '10:00', 'Culto dominical'),
  ('Miércoles', '19:00', 'Culto de oración'),
  ('Viernes', '19:00', 'Estudio bíblico')
) as h (dia, hora, tipo);

insert into public.miembros (sede_id, nombre, telefono, correo, fecha_ingreso, activo) values
  ('11111111-0000-4000-8000-000000000001', 'María Hernández López', '55 3067 4680', 'maria.hernandez@correo.mx', '2019-03-10', true),
  ('11111111-0000-4000-8000-000000000001', 'José García Martínez', '55 1826 4017', 'jose.garcia@correo.mx', '2020-07-05', true),
  ('11111111-0000-4000-8000-000000000001', 'Guadalupe Ramírez Cruz', '55 9252 5450', 'guadalupe.ramirez@correo.mx', '2021-01-17', true),
  ('11111111-0000-4000-8000-000000000001', 'Juan Pérez Flores', '55 2883 4681', 'juan.perez@correo.mx', '2022-09-25', true),
  ('11111111-0000-4000-8000-000000000001', 'Ana Sánchez Gómez', '55 7528 3961', 'ana.sanchez@correo.mx', '2023-02-12', true),
  ('11111111-0000-4000-8000-000000000001', 'Luis Torres Díaz', '55 6151 4686', 'luis.torres@correo.mx', '2024-05-19', false),
  ('11111111-0000-4000-8000-000000000001', 'Rosa Morales Vázquez', '55 3770 2121', 'rosa.morales@correo.mx', '2025-08-03', true),
  ('11111111-0000-4000-8000-000000000002', 'Carlos Reyes Jiménez', '81 4227 4560', 'carlos.reyes@correo.mx', '2018-11-04', true),
  ('11111111-0000-4000-8000-000000000002', 'Laura Mendoza Ruiz', '81 8752 5886', 'laura.mendoza@correo.mx', '2021-06-27', true),
  ('11111111-0000-4000-8000-000000000002', 'Miguel González Pérez', '81 6053 9881', 'miguel.gonzalez@correo.mx', '2023-10-08', true),
  ('11111111-0000-4000-8000-000000000003', 'Patricia Cruz Hernández', '33 4702 7672', 'patricia.cruz@correo.mx', '2020-02-16', true),
  ('11111111-0000-4000-8000-000000000003', 'Jorge Flores Torres', '33 5469 3344', 'jorge.flores@correo.mx', '2022-04-24', true),
  ('11111111-0000-4000-8000-000000000003', 'Sofía López Ramírez', '33 3699 1376', 'sofia.lopez@correo.mx', '2024-12-01', false);
