\set ON_ERROR_STOP 0
insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-4000-8000-000000000001','admin@x.mx','{"nombre":"Admin"}'),
 ('aaaaaaaa-0000-4000-8000-000000000002','secre@x.mx','{"nombre":"Secre"}'),
 ('aaaaaaaa-0000-4000-8000-000000000003','teso@x.mx','{}'),
 ('aaaaaaaa-0000-4000-8000-000000000004','miembro@x.mx','{}'),
 ('aaaaaaaa-0000-4000-8000-000000000005','intruso@x.mx','{"nombre":"Intruso","rol":"administrador"}');
select correo, rol, activo, sede_id is not null as con_sede from public.usuarios order by correo;
-- el administrador configura los perfiles (lo que hará la invitación)
update public.usuarios set rol='secretario', activo=true, sede_id='11111111-0000-4000-8000-000000000001' where correo='secre@x.mx';
update public.usuarios set rol='tesorero', activo=true, sede_id='11111111-0000-4000-8000-000000000002' where correo='teso@x.mx';
update public.usuarios set rol='miembro', activo=true, sede_id='11111111-0000-4000-8000-000000000001',
  miembro_id=(select id from public.miembros where nombre like 'Ana%') where correo='miembro@x.mx';

create function pg_temp.como(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;

set role authenticated;
\echo '--- ADMIN: miembros visibles (13 esperado), sedes (3)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000001');
select count(*) from public.miembros; select count(*) from public.sedes;
\echo '--- ADMIN: puede editar su propio rol? (0 filas esperado)'
update public.usuarios set rol='miembro' where id='aaaaaaaa-0000-4000-8000-000000000001';

\echo '--- SECRETARIO Centro: miembros (7), sedes (3), usuarios visibles (1)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000002');
select count(*) from public.miembros; select count(*) from public.sedes; select count(*) from public.usuarios;
\echo '--- SECRETARIO: crear miembro en su sede (OK)'
insert into public.miembros (sede_id, nombre) values ('11111111-0000-4000-8000-000000000001','Nuevo Centro');
\echo '--- SECRETARIO: crear miembro en otra sede (ERROR esperado)'
insert into public.miembros (sede_id, nombre) values ('11111111-0000-4000-8000-000000000002','Nuevo Norte');
\echo '--- SECRETARIO: mover miembro a otra sede (ERROR esperado)'
update public.miembros set sede_id='11111111-0000-4000-8000-000000000002' where nombre='Nuevo Centro';
\echo '--- SECRETARIO: borrar miembro (0 filas esperado)'
delete from public.miembros where nombre='Nuevo Centro';
\echo '--- SECRETARIO: subir de rol (0 filas)'
update public.usuarios set rol='administrador' where id='aaaaaaaa-0000-4000-8000-000000000002';
\echo '--- SECRETARIO: editar configuración (0 filas)'
update public.configuracion_iglesia set nombre='Hackeada';
\echo '--- SECRETARIO: crear sede (ERROR esperado)'
insert into public.sedes (nombre) values ('Sede pirata');

\echo '--- TESORERO Norte: miembros (3), editar uno (0 filas)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000003');
select count(*) from public.miembros;
update public.miembros set nombre='x';

\echo '--- MIEMBRO: solo su registro (1: Ana)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000004');
select nombre from public.miembros; select count(*) as horarios_sede from public.horarios;

\echo '--- INTRUSO (registro sin invitación): nada visible (0, 0)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000005');
select count(*) from public.miembros; select count(*) from public.sedes;
select rol, activo from public.usuarios;

\echo '--- ANON: configuración visible (1), miembros (ERROR permiso)'
reset role; set role anon;
select nombre from public.configuracion_iglesia;
select count(*) from public.miembros;
