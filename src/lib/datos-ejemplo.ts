import { CONCEPTOS, METODOS } from "./catalogos";
import type {
  Anuncio,
  Aportacion,
  Asistencia,
  ConfiguracionIglesia,
  Evento,
  Horario,
  Miembro,
  Ministerio,
  Sede,
  Usuario,
} from "./types";

// Datos ficticios para el prototipo. Las fechas se generan alrededor de "hoy"
// para que el calendario y el dashboard siempre tengan contenido reciente.

export interface BaseDatos {
  configuracion: ConfiguracionIglesia;
  sedes: Sede[];
  usuarios: Usuario[];
  miembros: Miembro[];
  eventos: Evento[];
  asistencias: Asistencia[];
  ministerios: Ministerio[];
  aportaciones: Aportacion[];
  anuncios: Anuncio[];
  horarios: Horario[];
}

// Generador pseudoaleatorio con semilla: los mismos datos en cada carga
function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const iso = (d: Date) => {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${dia}`;
};

const sumarDias = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const NOMBRES = [
  "María", "José", "Guadalupe", "Juan", "Ana", "Luis", "Rosa", "Carlos",
  "Laura", "Miguel", "Patricia", "Jorge", "Sofía", "Fernando", "Elena",
  "Ricardo", "Gabriela", "Andrés", "Verónica", "Daniel", "Claudia", "Pedro",
  "Mariana", "Alejandro", "Lucía", "Raúl", "Teresa", "Eduardo", "Paola", "Héctor",
];
const APELLIDOS = [
  "Hernández", "García", "Martínez", "López", "González", "Pérez",
  "Rodríguez", "Sánchez", "Ramírez", "Cruz", "Flores", "Gómez", "Morales",
  "Vázquez", "Reyes", "Jiménez", "Torres", "Díaz", "Ruiz", "Mendoza",
];

const sinAcentos = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function generarDatos(hoy: Date): BaseDatos {
  const rnd = aleatorio(2026);
  const elegir = <T,>(lista: T[]) => lista[Math.floor(rnd() * lista.length)];

  const sedes: Sede[] = [
    {
      id: "s1",
      nombre: "Sede Centro",
      direccion: "Av. Juárez 120, Centro, Ciudad de México",
      telefono: "55 5512 3400",
      correo: "centro@comunidaddefe.mx",
      activa: true,
    },
    {
      id: "s2",
      nombre: "Sede Norte",
      direccion: "Calle Morelos 845, Monterrey, N.L.",
      telefono: "81 8340 2200",
      correo: "norte@comunidaddefe.mx",
      activa: true,
    },
    {
      id: "s3",
      nombre: "Sede Occidente",
      direccion: "Av. Vallarta 3100, Guadalajara, Jal.",
      telefono: "33 3615 7800",
      correo: "occidente@comunidaddefe.mx",
      activa: true,
    },
  ];

  // Miembros: 26 por sede, algunos inactivos
  const miembros: Miembro[] = [];
  sedes.forEach((sede, si) => {
    for (let i = 0; i < 26; i++) {
      const nombre = `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`;
      const [n, a] = nombre.split(" ");
      miembros.push({
        id: `m${si + 1}-${i + 1}`,
        sedeId: sede.id,
        nombre,
        telefono: `${["55", "81", "33"][si]} ${1000 + Math.floor(rnd() * 8999)} ${1000 + Math.floor(rnd() * 8999)}`,
        correo: `${sinAcentos(n)}.${sinAcentos(a)}${i}@correo.mx`,
        fechaIngreso: iso(sumarDias(hoy, -Math.floor(30 + rnd() * 2500))),
        activo: rnd() > 0.12,
      });
    }
  });
  const deSede = (sedeId: string) => miembros.filter((m) => m.sedeId === sedeId);

  // Ministerios por sede
  const plantillas = [
    ["Música y alabanza", "Dirige la alabanza en cultos y eventos."],
    ["Jóvenes", "Actividades y estudio para jóvenes de 15 a 29 años."],
    ["Niños", "Escuela dominical y cuidado de niños."],
    ["Enseñanza", "Estudios bíblicos y discipulado."],
    ["Servicio", "Ujieres, limpieza, logística y apoyo social."],
  ];
  const ministerios: Ministerio[] = [];
  sedes.forEach((sede, si) => {
    const gente = deSede(sede.id);
    const coordinadores = new Set<string>();
    plantillas.forEach(([nombre, descripcion], mi) => {
      const integrantes = gente
        .filter((_, idx) => (idx + mi) % 4 === 0 || (idx * 7 + mi) % 5 === 0)
        .map((m) => m.id);
      // Cada ministerio con un coordinador distinto
      const coordinadorId = integrantes.find((id) => !coordinadores.has(id));
      if (coordinadorId) coordinadores.add(coordinadorId);
      ministerios.push({
        id: `min${si + 1}-${mi + 1}`,
        sedeId: sede.id,
        nombre,
        descripcion,
        coordinadorId,
        integrantes,
      });
    });
  });

  // Eventos: cultos semanales de las últimas 8 semanas y próximas 4,
  // más actividades de ministerio y eventos especiales.
  const eventos: Evento[] = [];
  let eid = 0;
  const domingoActual = sumarDias(hoy, -hoy.getDay());
  sedes.forEach((sede) => {
    const gente = deSede(sede.id);
    const mins = ministerios.filter((m) => m.sedeId === sede.id);
    for (let w = -8; w <= 4; w++) {
      const domingo = sumarDias(domingoActual, w * 7);
      eventos.push({
        id: `e${++eid}`,
        sedeId: sede.id,
        titulo: "Culto dominical",
        tipo: "Culto dominical",
        fecha: iso(domingo),
        hora: "10:00",
        lugar: "Templo principal",
        descripcion: "Culto general de adoración y predicación.",
        responsables: [gente[0].id],
        cancelado: false,
      });
      eventos.push({
        id: `e${++eid}`,
        sedeId: sede.id,
        titulo: "Culto de oración",
        tipo: "Culto de oración",
        fecha: iso(sumarDias(domingo, 3)),
        hora: "19:00",
        lugar: "Salón de oración",
        descripcion: "Reunión de oración entre semana.",
        responsables: [gente[1].id],
        cancelado: false,
      });
      const min = mins[(w + 8) % mins.length];
      eventos.push({
        id: `e${++eid}`,
        sedeId: sede.id,
        ministerioId: min.id,
        titulo: `Reunión de ${min.nombre}`,
        tipo: "Reunión de ministerio",
        fecha: iso(sumarDias(domingo, 6)),
        hora: "17:00",
        lugar: "Aula 2",
        descripcion: `Reunión mensual del ministerio de ${min.nombre.toLowerCase()}.`,
        responsables: min.coordinadorId ? [min.coordinadorId] : [],
        cancelado: false,
      });
    }
    eventos.push({
      id: `e${++eid}`,
      sedeId: sede.id,
      titulo: "Retiro de jóvenes",
      tipo: "Actividad especial",
      fecha: iso(sumarDias(hoy, 12)),
      hora: "08:00",
      lugar: "Campamento Las Cumbres",
      descripcion: "Retiro de fin de semana con alabanza, talleres y convivencia.",
      responsables: [gente[3].id, gente[4].id],
      ministerioId: mins[1].id,
      cancelado: false,
    });
    eventos.push({
      id: `e${++eid}`,
      sedeId: sede.id,
      titulo: "Junta de tesorería y administración",
      tipo: "Reunión administrativa",
      fecha: iso(sumarDias(hoy, 5)),
      hora: "18:30",
      lugar: "Oficina pastoral",
      descripcion: "Revisión de ingresos del mes y presupuesto.",
      responsables: [gente[2].id],
      cancelado: false,
    });
  });

  // Asistencia de los eventos ya pasados
  const asistencias: Asistencia[] = [];
  const hoyIso = iso(hoy);
  eventos
    .filter((e) => e.fecha < hoyIso)
    .forEach((e) => {
      const min = ministerios.find((m) => m.id === e.ministerioId);
      const invitados = min
        ? min.integrantes
        : deSede(e.sedeId).filter((m) => m.activo).map((m) => m.id);
      const tasa = e.tipo === "Culto dominical" ? 0.82 : 0.6;
      invitados.forEach((miembroId) =>
        asistencias.push({ eventoId: e.id, miembroId, presente: rnd() < tasa })
      );
    });

  // Usuarios de demostración (uno por rol en la Sede Centro)
  const centro = deSede("s1");
  const usuarios: Usuario[] = [
    { id: "u1", nombre: "Admin General", correo: "admin@comunidaddefe.mx", rol: "administrador", sedeId: "s1", activo: true },
    { id: "u2", nombre: `Pastor ${centro[0].nombre.split(" ").slice(0, 2).join(" ")}`, correo: "pastor@comunidaddefe.mx", rol: "pastor", sedeId: "s1", miembroId: centro[0].id, activo: true },
    { id: "u3", nombre: centro[1].nombre, correo: "secretaria@comunidaddefe.mx", rol: "secretario", sedeId: "s1", miembroId: centro[1].id, activo: true },
    { id: "u4", nombre: centro[2].nombre, correo: "tesoreria@comunidaddefe.mx", rol: "tesorero", sedeId: "s1", miembroId: centro[2].id, activo: true },
    { id: "u5", nombre: centro.find((m) => m.id === ministerios[1].coordinadorId)?.nombre ?? centro[3].nombre, correo: "jovenes@comunidaddefe.mx", rol: "coordinador", sedeId: "s1", miembroId: ministerios[1].coordinadorId, activo: true },
    { id: "u6", nombre: centro[5].nombre, correo: "miembro@comunidaddefe.mx", rol: "miembro", sedeId: "s1", miembroId: centro[5].id, activo: true },
  ];

  // Aportaciones de los últimos 6 meses
  const aportaciones: Aportacion[] = [];
  let aid = 0;
  sedes.forEach((sede) => {
    const gente = deSede(sede.id);
    for (let d = -180; d <= 0; d++) {
      const fecha = sumarDias(hoy, d);
      if (fecha.getDay() !== 0 && rnd() > 0.15) continue;
      const n = fecha.getDay() === 0 ? 6 + Math.floor(rnd() * 6) : 1;
      for (let k = 0; k < n; k++) {
        const concepto = rnd() < 0.45 ? "Diezmo" : rnd() < 0.7 ? "Ofrenda" : elegir(CONCEPTOS);
        const anonima = concepto === "Ofrenda" ? rnd() < 0.6 : rnd() < 0.1;
        const base = concepto === "Diezmo" ? 800 + rnd() * 2200 : 100 + rnd() * 900;
        aportaciones.push({
          id: `a${++aid}`,
          sedeId: sede.id,
          fecha: iso(fecha),
          monto: Math.round(base / 10) * 10,
          concepto,
          metodo: anonima ? "Efectivo" : elegir(METODOS),
          miembroId: anonima ? undefined : elegir(gente).id,
          registradoPor: "u4",
        });
      }
    }
  });

  const anuncios: Anuncio[] = [
    {
      id: "an1",
      sedeId: null,
      titulo: "Aniversario de la iglesia",
      contenido: "Celebraremos nuestro 25 aniversario con un culto unido de todas las sedes. ¡No faltes!",
      fechaPublicacion: iso(sumarDias(hoy, -2)),
      importante: true,
      autorId: "u2",
    },
    {
      id: "an2",
      sedeId: "s1",
      titulo: "Inscripciones abiertas para el retiro de jóvenes",
      contenido: "Aparta tu lugar con el coordinador de jóvenes antes del viernes. Cupo limitado a 60 personas.",
      fechaPublicacion: iso(sumarDias(hoy, -4)),
      importante: false,
      autorId: "u3",
    },
    {
      id: "an3",
      sedeId: "s1",
      titulo: "Colecta de víveres",
      contenido: "Durante todo el mes recibiremos despensa para familias de la colonia. Entrega en la recepción.",
      fechaPublicacion: iso(sumarDias(hoy, -9)),
      importante: false,
      autorId: "u3",
    },
    {
      id: "an4",
      sedeId: "s2",
      titulo: "Cambio de horario del culto de oración",
      contenido: "A partir de este mes el culto de oración será a las 19:30.",
      fechaPublicacion: iso(sumarDias(hoy, -6)),
      importante: true,
      autorId: "u1",
    },
  ];

  const horarios: Horario[] = sedes.flatMap((s, i) => [
    { id: `h${i}-1`, sedeId: s.id, dia: "Domingo", hora: "10:00", tipo: "Culto dominical" },
    { id: `h${i}-2`, sedeId: s.id, dia: "Miércoles", hora: "19:00", tipo: "Culto de oración" },
    { id: `h${i}-3`, sedeId: s.id, dia: "Viernes", hora: "19:00", tipo: "Estudio bíblico" },
  ]);

  return {
    configuracion: {
      nombre: "Iglesia Comunidad de Fe",
      lema: "Una familia, muchas sedes",
    },
    sedes,
    usuarios,
    miembros,
    eventos,
    asistencias,
    ministerios,
    aportaciones,
    anuncios,
    horarios,
  };
}
