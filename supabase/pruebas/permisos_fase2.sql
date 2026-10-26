\set ON_ERROR_STOP 0
-- Se corre después de permisos.sql (usa sus usuarios) y de seed_fase2.sql.
-- Agrega un coordinador (Juan, de Jóvenes en la Sede Centro) y un pastor de la Sede Norte.
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-4000-8000-000000000006','juan@x.mx','{"nombre":"Juan"}'),
 ('aaaaaaaa-0000-4000-8000-000000000007','pastor.norte@x.mx','{"nombre":"Pastor Norte"}');
update public.usuarios set rol='coordinador', activo=true, sede_id='11111111-0000-4000-8000-000000000001',
  miembro_id=(select id from public.miembros where nombre='Juan Pérez Flores') where correo='juan@x.mx';
update public.usuarios set rol='pastor', activo=true, sede_id='11111111-0000-4000-8000-000000000002' where correo='pastor.norte@x.mx';

create temp view ids as select
  (select id from public.ministerios where nombre='Jóvenes' and sede_id='11111111-0000-4000-8000-000000000001') jovenes,
  (select id from public.ministerios where nombre='Música y alabanza' and sede_id='11111111-0000-4000-8000-000000000001') musica,
  (select id from public.ministerios where nombre='Jóvenes' and sede_id='11111111-0000-4000-8000-000000000002') jovenes_norte,
  (select id from public.eventos where titulo='Culto dominical' and sede_id='11111111-0000-4000-8000-000000000001' and fecha < current_date order by fecha desc limit 1) culto,
  (select id from public.eventos where titulo='Reunión de Jóvenes' and sede_id='11111111-0000-4000-8000-000000000001' and fecha < current_date order by fecha desc limit 1) reunion_jovenes,
  (select id from public.miembros where nombre='José García Martínez') jose,
  (select id from public.miembros where nombre='Carlos Reyes Jiménez') carlos;
grant select on ids to authenticated;

create or replace function pg_temp.como(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;
set role authenticated;

\echo '=== COORDINADOR Juan (Jóvenes, Centro)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000006');
\echo '--- ministerios visibles (3), eventos de su sede (35)'
select count(*) from public.ministerios; select count(*) from public.eventos;
\echo '--- asistencia visible: solo de reuniones de Jóvenes (todas son de Jóvenes: t)'
select bool_and(e.ministerio_id = (select jovenes from ids)) from public.asistencias a join public.eventos e on e.id = a.evento_id;
\echo '--- crear evento de Jóvenes (OK)'
insert into public.eventos (sede_id, ministerio_id, titulo, tipo, fecha, hora) select '11111111-0000-4000-8000-000000000001', jovenes, 'Noche de jóvenes', 'Actividad especial', current_date + 3, '19:00' from ids;
\echo '--- crear evento de Música (ERROR esperado)'
insert into public.eventos (sede_id, ministerio_id, titulo, tipo, fecha, hora) select '11111111-0000-4000-8000-000000000001', musica, 'Ensayo', 'Reunión de ministerio', current_date + 3, '19:00' from ids;
\echo '--- crear evento general sin ministerio (ERROR esperado)'
insert into public.eventos (sede_id, titulo, tipo, fecha, hora) values ('11111111-0000-4000-8000-000000000001', 'Culto especial', 'Actividad especial', current_date + 3, '19:00');
\echo '--- cancelar un culto dominical (0 filas)'
update public.eventos set cancelado = true where id = (select culto from ids);
\echo '--- agregar a José a Jóvenes (OK) y a Música (ERROR esperado)'
insert into public.ministerio_integrantes select jovenes, jose from ids;
insert into public.ministerio_integrantes select musica, jose from ids;
\echo '--- agregar a Carlos (Sede Norte) a Jóvenes (ERROR esperado)'
insert into public.ministerio_integrantes select jovenes, carlos from ids;
\echo '--- cambiar el coordinador de Jóvenes (0 filas)'
update public.ministerios set coordinador_id = (select jose from ids) where id = (select jovenes from ids);
\echo '--- pasar lista en la reunión de Jóvenes (OK) y en el culto (ERROR esperado)'
insert into public.asistencias (evento_id, miembro_id, presente) select reunion_jovenes, jose, true from ids
  on conflict (evento_id, miembro_id) do update set presente = excluded.presente;
insert into public.asistencias (evento_id, miembro_id, presente) select culto, jose, true from ids
  on conflict (evento_id, miembro_id) do update set presente = excluded.presente;
\echo '--- publicar anuncio (ERROR esperado)'
insert into public.anuncios (sede_id, titulo) values ('11111111-0000-4000-8000-000000000001', 'Aviso');

\echo '=== SECRETARIO Centro'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000002');
\echo '--- crear ministerio en su sede (OK) y en Norte (ERROR esperado)'
insert into public.ministerios (sede_id, nombre) values ('11111111-0000-4000-8000-000000000001', 'Niños');
insert into public.ministerios (sede_id, nombre) values ('11111111-0000-4000-8000-000000000002', 'Niños');
\echo '--- poner como coordinador a alguien de otra sede (ERROR esperado)'
update public.ministerios set coordinador_id = (select carlos from ids) where id = (select jovenes from ids);
\echo '--- cancelar un culto de su sede (1 fila) y uno de Norte (0 filas)'
update public.eventos set cancelado = true where id = (select culto from ids);
update public.eventos set cancelado = true where sede_id = '11111111-0000-4000-8000-000000000002';
\echo '--- pasar lista en el culto (OK)'
insert into public.asistencias (evento_id, miembro_id, presente) select culto, jose, false from ids
  on conflict (evento_id, miembro_id) do update set presente = excluded.presente;
\echo '--- anuncio en su sede firmado con otro nombre: la base pone "Secre"'
insert into public.anuncios (sede_id, titulo, autor_nombre, fecha_publicacion) values ('11111111-0000-4000-8000-000000000001', 'Ensayo general', 'Pastor', current_date + 10);
select titulo, autor_nombre from public.anuncios where titulo = 'Ensayo general';
\echo '--- anuncio para todas las sedes (ERROR esperado)'
insert into public.anuncios (sede_id, titulo) values (null, 'Para todos');
\echo '--- mover un anuncio a Norte (ERROR esperado) y borrar uno de Norte (0 filas)'
update public.anuncios set sede_id = '11111111-0000-4000-8000-000000000002' where titulo = 'Ensayo general';
delete from public.anuncios where sede_id = '11111111-0000-4000-8000-000000000002';

\echo '=== PASTOR Norte: anuncios de Norte y globales (2), borrar el de Norte (1 fila)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000007');
select count(*) from public.anuncios;
delete from public.anuncios where sede_id = '11111111-0000-4000-8000-000000000002';

\echo '=== TESORERO Norte: ministerios (2), eventos (34), asistencia (0), crear evento (ERROR esperado)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000003');
select count(*) from public.ministerios; select count(*) from public.eventos; select count(*) from public.asistencias;
insert into public.eventos (sede_id, titulo, tipo, fecha, hora) values ('11111111-0000-4000-8000-000000000002', 'X', 'Evangelismo', current_date, '10:00');

\echo '=== MIEMBRO Ana: eventos de su sede (36), ministerios (0), asistencia (0)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000004');
select count(*) from public.eventos; select count(*) from public.ministerios; select count(*) from public.asistencias;
\echo '--- anuncios publicados de su sede y globales (3; el programado no se ve)'
select titulo from public.anuncios order by fecha_publicacion desc;
\echo '--- publicar anuncio (ERROR esperado)'
insert into public.anuncios (sede_id, titulo) values ('11111111-0000-4000-8000-000000000001', 'Hola');

\echo '=== INTRUSO: eventos (0), anuncios (0)'
select pg_temp.como('aaaaaaaa-0000-4000-8000-000000000005');
select count(*) from public.eventos; select count(*) from public.anuncios;
