# Configurar Supabase (Fase 1)

Esta guía conecta la aplicación a una base de datos real. Toma unos 15 minutos y usa el plan gratuito de Supabase. Sin estos pasos, la aplicación sigue funcionando en **modo demostración**.

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y luego **New project**.
2. Ponle un nombre (por ejemplo `gestion-iglesias`), elige una contraseña para la base de datos y guárdala en un lugar seguro.
3. En **Region** elige la más cercana a México (por ejemplo *East US* o *West US*).
4. Espera uno o dos minutos a que el proyecto termine de crearse.

## 2. Crear las tablas y la seguridad

1. En el menú izquierdo abre **SQL Editor** y crea una consulta nueva (**New query**).
2. Copia todo el contenido de [`supabase/migrations/20261026000001_fase1_esquema.sql`](../supabase/migrations/20261026000001_fase1_esquema.sql), pégalo y presiona **Run**. Debe decir *Success. No rows returned*.
3. (Opcional) Para tener datos de ejemplo, crea otra consulta con el contenido de [`supabase/seed.sql`](../supabase/seed.sql) y presiona **Run**. Esto agrega la "Iglesia Comunidad de Fe" con 3 sedes, horarios y algunos miembros.

> Haz el paso 3 **antes** del paso 5: así el administrador queda asignado automáticamente a la primera sede.

## 3. Cerrar el registro público

Las cuentas solo se crean por invitación desde la aplicación, así nadie puede registrarse por su cuenta.

1. Ve a **Authentication → Sign In / Providers**.
2. Desactiva **Allow new users to sign up** y guarda.

Aunque alguien lograra crear una cuenta, la base de datos la deja inactiva y sin acceso a nada hasta que un administrador le asigne rol y sede.

## 4. Direcciones de la aplicación

1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** escribe `http://localhost:3000` (cámbialo por la dirección de Vercel cuando publiques la app).
3. En **Redirect URLs** agrega `http://localhost:3000/restablecer` (y después `https://tu-app.vercel.app/restablecer`).

Estas direcciones son a donde llevan los correos de invitación y de recuperación de contraseña.

## 5. Crear el primer administrador

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Escribe tu correo y una contraseña, deja marcada **Auto Confirm User** y crea el usuario.

**La primera cuenta del sistema queda como administrador automáticamente.** Las siguientes se crean desde la pantalla *Usuarios* de la aplicación.

## 6. Conectar la aplicación

1. Ve a **Project Settings → API Keys** (o **Data API**) y copia:
   - **Project URL**
   - la llave **anon / public**
   - la llave **service_role** (es secreta: permite crear cuentas)
2. En la carpeta del proyecto copia `.env.example` como `.env.local` y pega los valores:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. Ejecuta `npm run dev`, abre http://localhost:3000 y entra con el administrador del paso 5.

`.env.local` está en `.gitignore`: nunca subas la llave `service_role` al repositorio ni la compartas.

## 7. Invitar al equipo

En **Usuarios → Invitar usuario** escribe nombre, correo, rol y sede. La persona recibe un correo con un enlace para crear su contraseña.

El servicio de correo incluido en Supabase solo envía unos pocos correos por hora. Para un proyecto académico alcanza; si necesitas más, configura un SMTP propio en **Project Settings → Authentication → SMTP Settings**.

## Publicar en Vercel (opcional)

1. En [vercel.com](https://vercel.com) importa el repositorio de GitHub.
2. En **Environment Variables** agrega las mismas tres variables del paso 6.
3. Cuando termine el despliegue, actualiza la **Site URL** y las **Redirect URLs** del paso 4 con la dirección de Vercel.

## Qué protege la base de datos

Las reglas de acceso están en la propia base de datos (Row Level Security), no solo en la interfaz:

| Tabla | Quién ve | Quién modifica |
| --- | --- | --- |
| Sedes | Cualquier usuario activo | Administrador |
| Usuarios | Su propio perfil; pastor los de su sede; administrador todos | Administrador (nadie cambia su propio rol) |
| Miembros | Administrador todas las sedes; pastor, secretario, tesorero y coordinador su sede; un miembro solo su registro | Administrador; pastor y secretario en su sede. Nadie borra: se desactivan |
| Configuración | Todos (se muestra en el inicio de sesión) | Administrador |
| Horarios | Su sede | Administrador |
| Logotipo | Público | Administrador |

Las pruebas de estas reglas están en [`supabase/pruebas/`](../supabase/pruebas).

## Desarrollo local con Docker (opcional)

Si tienes Docker, `npx supabase start` levanta Supabase en tu computadora con la migración y los datos de ejemplo ya aplicados (la configuración está en `supabase/config.toml`). `npx supabase status` muestra la URL y las llaves para `.env.local`, y los correos de invitación se ven en http://127.0.0.1:54324.
