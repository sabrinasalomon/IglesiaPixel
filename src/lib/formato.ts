const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export const mxn = (monto: number) => moneda.format(monto);

// Las fechas se guardan como AAAA-MM-DD; se leen como fecha local para evitar
// que la zona horaria las corra un día.
export const aFecha = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const fechaCorta = (iso: string) =>
  aFecha(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const fechaLarga = (iso: string) => {
  const t = aFecha(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const mesCorto = (clave: string) => {
  const [a, m] = clave.split("-").map(Number);
  return `${MESES[m - 1].slice(0, 3)} ${String(a).slice(2)}`;
};
