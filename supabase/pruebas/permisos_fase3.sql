\set ON_ERROR_STOP 0
-- Se corre después de permisos.sql y permisos_fase2.sql (usa sus usuarios) y de seed_fase3.sql.
-- Usuarios: admin (…01), secretario Centro (…02), tesorero Norte (…03), miembro Centro (…04),
-- coordinador Centro (…06), pastor Norte (…07).
reset role;
create or replace function pg_temp.como(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;
create temp table esperado as
  select sede_id, count(*) n from public.aportaciones group by sede_id;
create temp table ana as select id from public.miembros where nombre = 'Ana Sánchez Gómez';
grant select on esperado, ana to authenticated;
set role authenticated;

\echo '=== ADMIN: ve todas las aportaciones (t)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000001');
select count(*) = (select sum(n) from esperado) from public.aportaciones;

\echo '=== TESORERO Norte'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000003');
\echo '--- solo ve las de su sede (t, t)'
select count(*) = (select n from esperado where sede_id = '11111111-0000-4000-8000-000000000002') from public.aportaciones;
select bool_and(sede_id = '11111111-0000-4000-8000-000000000002') from public.aportaciones;
\echo '--- registra una en su sede (OK) y queda como autor (t)'
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo, registrado_por)
  values ('11111111-0000-4000-8000-000000000002', current_date, 500, 'Ofrenda', 'Efectivo', 'aaaaaaaa-0000-4000-8000-000000000001');
select registrado_por = 'aaaaaaaa-0000-4000-8000-000000000003' from public.aportaciones where creado_en = (select max(creado_en) from public.aportaciones);
\echo '--- registrar en otra sede (ERROR esperado)'
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo) values ('11111111-0000-4000-8000-000000000001', current_date, 500, 'Ofrenda', 'Efectivo');
\echo '--- aportante de otra sede (ERROR esperado)'
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo, miembro_id)
  values ('11111111-0000-4000-8000-000000000002', current_date, 500, 'Diezmo', 'Efectivo', (select id from ana));
\echo '--- monto negativo (ERROR esperado)'
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo) values ('11111111-0000-4000-8000-000000000002', current_date, -10, 'Ofrenda', 'Efectivo');
\echo '--- cambiar el monto (ERROR de permiso esperado) y anular (1 fila)'
update public.aportaciones set monto = 1 where registrado_por = 'aaaaaaaa-0000-4000-8000-000000000003';
update public.aportaciones set anulada = true where registrado_por = 'aaaaaaaa-0000-4000-8000-000000000003';
\echo '--- borrar (ERROR de permiso esperado)'
delete from public.aportaciones;

\echo '=== PASTOR Norte: ve las de su sede (t) pero no registra (ERROR esperado) ni anula (0 filas)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000007');
select count(*) > 0 and bool_and(sede_id = '11111111-0000-4000-8000-000000000002') from public.aportaciones;
insert into public.aportaciones (sede_id, fecha, monto, concepto, metodo) values ('11111111-0000-4000-8000-000000000002', current_date, 100, 'Ofrenda', 'Efectivo');
update public.aportaciones set anulada = false;

\echo '=== SECRETARIO, COORDINADOR y MIEMBRO: no ven nada (0, 0, 0)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000002'); select count(*) from public.aportaciones;
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000006'); select count(*) from public.aportaciones;
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000004'); select count(*) from public.aportaciones;
