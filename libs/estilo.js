/**
 * libs/estilo.js — La pinta del bot en Telegram.
 *
 * Todos los mensajes bonitos (menús, tarjetas de descarga, fichas...) salen de
 * aquí, así el bot se ve igual de bien en todas partes y cambiar el estilo es
 * tocar un solo archivo.
 *
 * Se apoya en lo que Telegram hace bien y WhatsApp no:
 *   *negrita*  _cursiva_  `código`   (el `código` se copia al tocarlo)
 *   >| línea   → cita con barra vertical
 *   >+ línea   → cita PLEGABLE: el usuario la abre si le interesa
 *
 * Por eso ya no hacen falta los marcos de guiones ╭━━━◆ que se usaban en
 * WhatsApp: aquí quedan anticuados y ocupan la mitad del mensaje.
 */

/* ─────────────────────────── Piezas sueltas ─────────────────────────── */

/** Título grande con su emoji. Va arriba del todo. */
export const titulo = (emoji, texto) => `${emoji} *${String(texto).toUpperCase()}*`;

/** Subtítulo de sección */
export const seccion = (emoji, texto) => `${emoji} *${texto}*`;

/** Línea suave para separar bloques */
export const linea = "➖➖➖➖➖➖➖➖➖➖➖";

/** Cita normal (barra vertical gris) a partir de varias líneas */
export const cita = (lineas) =>
  (Array.isArray(lineas) ? lineas : String(lineas).split("\n"))
    .filter((l) => l !== undefined && l !== null)
    .map((l) => `>| ${l}`)
    .join("\n");

/** Cita plegable: perfecta para listas largas que no queremos que estorben */
export const citaPlegable = (lineas) =>
  (Array.isArray(lineas) ? lineas : String(lineas).split("\n"))
    .filter((l) => l !== undefined && l !== null)
    .map((l) => `>+ ${l}`)
    .join("\n");

/** Fila de "clave: valor" alineada, para las fichas */
export const dato = (emoji, clave, valor) => `${emoji} *${clave}:* ${valor}`;

/** Comando en monoespaciado: en Telegram se copia con solo tocarlo */
export const cmd = (texto) => `\`${texto}\``;

/* ─────────────────────────── Utilidades ─────────────────────────── */

/** 3.42 MB / 812 KB */
export function peso(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1048576) return `${(n / 1048576).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** 245 → "4:05" */
export function duracion(segundos) {
  const s = Math.max(0, Math.round(Number(segundos) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

/** 1234567 → "1.234.567" */
export const numero = (n) => Number(n || 0).toLocaleString("es");

/** Recorta sin cortar a mitad de palabra */
export function recortar(texto, largo = 60) {
  const t = String(texto || "").trim();
  if (t.length <= largo) return t;
  const corte = t.slice(0, largo);
  const espacio = corte.lastIndexOf(" ");
  return `${(espacio > largo * 0.6 ? corte.slice(0, espacio) : corte).trim()}…`;
}

/** Barra de progreso con bloques: ▰▰▰▰▱▱▱▱ */
export function barra(parte, total, ancho = 10) {
  const p = total > 0 ? Math.min(1, Math.max(0, parte / total)) : 0;
  const llenos = Math.round(p * ancho);
  return "▰".repeat(llenos) + "▱".repeat(ancho - llenos);
}

/* ─────────────────────────── Bloques armados ─────────────────────────── */

/**
 * Ficha de algo que se va a descargar (canción, video, archivo...).
 *
 * @param {object} o
 *   emoji, fuente   → "🎵", "YOUTUBE"
 *   nombre          → título de la pieza
 *   datos           → [["👤","Canal","Bad Bunny"], ["⏱️","Duración","3:24"]]
 *   enlace          → url original (opcional)
 *   pie             → texto final (opcional)
 */
export function ficha({ emoji = "📦", fuente = "ARCHIVO", nombre = "", datos = [], enlace = "", pie = "" }) {
  const partes = [titulo(emoji, fuente), "", `*${recortar(nombre, 70)}*`];

  const filas = datos.filter(([, , v]) => v !== undefined && v !== null && v !== "");
  if (filas.length) partes.push("", cita(filas.map(([e, k, v]) => `${e} ${k}: ${v}`)));
  if (enlace) partes.push("", `🔗 ${enlace}`);
  if (pie) partes.push("", pie);

  return partes.join("\n");
}

/** Aviso corto y limpio: ✅ / ⚠️ / ❌ / ℹ️ */
export const aviso = (emoji, texto, detalle = "") =>
  `${emoji} *${texto}*${detalle ? `\n\n${detalle}` : ""}`;

export const ok = (texto, detalle) => aviso("✅", texto, detalle);
export const error = (texto, detalle) => aviso("❌", texto, detalle);
export const atencion = (texto, detalle) => aviso("⚠️", texto, detalle);
export const info = (texto, detalle) => aviso("ℹ️", texto, detalle);

/**
 * Ayuda de un comando cuando se usa mal.
 * @param {object} o  { emoji, nombre, para, usos: [], ejemplos: [], nota }
 */
export function ayuda({ emoji = "💡", nombre, para = "", usos = [], ejemplos = [], nota = "" }) {
  const partes = [titulo(emoji, nombre)];
  if (para) partes.push("", para);
  if (usos.length) partes.push("", cita(usos.map((u) => `${u}`)));
  if (ejemplos.length) partes.push("", "*Ejemplos:*", ...ejemplos.map((e) => `• ${e}`));
  if (nota) partes.push("", `_${nota}_`);
  return partes.join("\n");
}

export default {
  titulo, seccion, linea, cita, citaPlegable, dato, cmd,
  peso, duracion, numero, recortar, barra,
  ficha, aviso, ok, error, atencion, info, ayuda
};
