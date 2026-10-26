# Publicar la aplicación en internet (Vercel)

Vercel aloja aplicaciones Next.js gratis para proyectos personales y académicos. Cada vez que se fusiona un cambio en GitHub, publica la nueva versión sola.

## Antes de empezar

- La base de datos de Supabase ya debe estar lista, siguiendo [SUPABASE.md](SUPABASE.md) del paso 1 al 5.
- Los cambios deben estar en la rama principal del repositorio (`estable`). Si hay un pull request abierto, fusiónalo primero.
- Tu cuenta de GitHub necesita acceso al repositorio. Si el repositorio es de otra persona, pídele que te agregue como colaborador o que haga ella este paso.

## 1. Importar el repositorio

1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub.
2. Haz clic en **Add New → Project** y elige el repositorio `Gestion_de_Iglesias_Web_Application`.
3. Vercel detecta que es Next.js. No cambies la configuración de compilación.

## 2. Variables de entorno

Antes de presionar **Deploy**, abre **Environment Variables** y agrega las tres que están en tu `.env.local`:

| Nombre | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | La **Project URL** de Supabase (`https://xxxxxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La llave pública (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | La llave secreta (`sb_secret_…`) |

La llave secreta solo se usa en el servidor de Vercel para enviar invitaciones. Nunca llega al navegador de los usuarios.

Presiona **Deploy**. En uno o dos minutos Vercel te da una dirección como `https://gestion-iglesias.vercel.app`.

## 3. Avisar a Supabase de la nueva dirección

Los correos de invitación y de recuperación de contraseña deben llevar a la dirección pública, no a `localhost`.

1. En Supabase ve a **Authentication → URL Configuration**.
2. En **Site URL** escribe la dirección de Vercel.
3. En **Redirect URLs** agrega `https://tu-app.vercel.app/restablecer`. Puedes dejar también la de `localhost` para seguir probando en tu computadora.

## 4. Probar

1. Abre la dirección de Vercel y entra con tu cuenta de administrador.
2. Invita a un usuario de prueba desde **Usuarios** y revisa que el enlace del correo abra la página para definir su contraseña.

## Si algo falla

- **La página dice "modo demostración":** faltan las variables de entorno. Agrégalas en **Settings → Environment Variables** y vuelve a publicar desde **Deployments → Redeploy**.
- **Las invitaciones fallan con "Falta configurar SUPABASE_SERVICE_ROLE_KEY":** falta la llave secreta en Vercel, o tiene un error de copia.
- **El enlace del correo lleva a localhost:** revisa el paso 3.
