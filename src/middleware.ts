import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { modoDemo, RUTAS_PUBLICAS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Renueva la sesión de Supabase en cada petición y manda al inicio de sesión
// a quien no la tenga. En modo demostración no hace nada.
export async function middleware(request: NextRequest) {
  if (modoDemo) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  if (!user && !RUTAS_PUBLICAS.some((r) => ruta.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
