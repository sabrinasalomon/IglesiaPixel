# Pruebas de permisos

`permisos.sql` comprueba las políticas de seguridad (RLS) de la Fase 1 con
usuarios de cada rol: qué filas ve cada uno y qué cambios le rechaza la base
de datos.

Se pueden correr en un PostgreSQL 16 local sin Supabase:

```bash
createdb prueba
psql -d prueba -f supabase/pruebas/entorno_simulado.sql \
               -f supabase/migrations/20261026000001_fase1_esquema.sql \
               -f supabase/seed.sql \
               -f supabase/pruebas/permisos.sql
```

`entorno_simulado.sql` crea lo mínimo que Supabase trae de fábrica (roles
`anon` y `authenticated`, `auth.users`, `auth.uid()` y `storage`). Cada bloque
de `permisos.sql` indica el resultado esperado; las líneas `ERROR` esperadas
son rechazos de la base de datos.
