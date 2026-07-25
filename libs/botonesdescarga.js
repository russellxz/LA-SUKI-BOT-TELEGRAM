/**
 * libs/botonesdescarga.js — Menú de botones para todos los comandos de descarga.
 *
 * En WhatsApp cada comando mandaba una vista previa con botones
 * ("🎬 Video Normal" / "📁 Video Documento") y el archivo solo se bajaba cuando
 * el usuario elegía. Aquí se hace igual, pero con los botones nativos de
 * Telegram (inline keyboard) en vez de los de Baileys.
 *
 * Uso desde un plugin:
 *
 *   await menuDescarga(conn, msg, {
 *     titulo: "Mi video",
 *     info: "📝 Título: ...",
 *     miniatura: "https://...",
 *     opciones: opcionesVideo(),          // o las que quieras
 *     resolver: async (opcion) => ({ url, nombre: "video.mp4" })
 *   });
 */

import { descargarBuffer, MAX_SUBIDA } from "./descargas.js";

/** Trabajos esperando que alguien pulse un botón: clave → datos */
const trabajos = new Map();
let contador = 0;

const nuevaClave = () => `${Date.now().toString(36)}${(contador++ % 46656).toString(36)}`;

const VIDA = 20 * 60 * 1000; // 20 minutos

function limpiarViejos() {
  const limite = Date.now() - VIDA;
  for (const [k, v] of trabajos) if (v.ts < limite) trabajos.delete(k);
}

/** Nombre de archivo sin caracteres raros */
export function limpiarNombre(texto, respaldo = "archivo") {
  return String(texto || "").replace(/[\\/:*?"<>|\n\r]/g, "").trim().slice(0, 60) || respaldo;
}

const pesar = (bytes) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

/* ─────────────── Juegos de botones más usados ─────────────── */

/** Video normal / Video documento (Facebook, TikTok, Twitter, Instagram...) */
export const opcionesVideo = () => [
  { id: "v", texto: "🎬 Video Normal", tipo: "video" },
  { id: "vd", texto: "📁 Video Documento", tipo: "documento" }
];

/** Audio normal / Audio documento (YouTube mp3, Spotify...) */
export const opcionesAudio = () => [
  { id: "a", texto: "🎵 Audio", tipo: "audio" },
  { id: "ad", texto: "📄 Audio Documento", tipo: "documento" }
];

/** Foto normal / Foto documento (Pinterest, Instagram de fotos...) */
export const opcionesImagen = () => [
  { id: "i", texto: "🖼️ Imagen", tipo: "imagen" },
  { id: "idoc", texto: "📄 Imagen Documento", tipo: "documento" }
];

/** Documento suelto (MediaFire, APK...) */
export const opcionesArchivo = () => [
  { id: "f", texto: "📁 Descargar archivo", tipo: "documento" }
];

/** Calidades de video de YouTube, en normal y en documento */
export const CALIDADES_YT = ["144", "240", "360", "720", "1080", "1440", "4k"];

export const opcionesYoutubeVideo = (calidades = ["360", "720", "1080"]) => [
  ...calidades.map((q) => ({ id: `v${q}`, texto: `🎬 ${q === "4k" ? "4K" : `${q}p`}`, tipo: "video", calidad: q })),
  ...calidades.map((q) => ({ id: `d${q}`, texto: `📁 ${q === "4k" ? "4K" : `${q}p`} doc`, tipo: "documento", calidad: q }))
];

/* ─────────────────────── Menú ─────────────────────── */

function enFilas(botones, porFila) {
  const filas = [];
  for (let i = 0; i < botones.length; i += porFila) filas.push(botones.slice(i, i + porFila));
  return filas;
}

/**
 * Manda la vista previa con los botones y deja el trabajo apuntado.
 *
 * @param {object} conn
 * @param {object} msg   mensaje que disparó el comando
 * @param {object} opts
 *   titulo    → nombre de lo que se va a bajar
 *   info      → texto de la vista previa
 *   miniatura → url de la portada (opcional)
 *   opciones  → botones: [{ id, texto, tipo, calidad }]
 *   resolver  → async (opcion) => { url | buffer, nombre, titulo?, caption? }
 *   porFila   → cuántos botones por fila (3 por defecto)
 *   enlace    → url original, por si falla la descarga
 */
export async function menuDescarga(conn, msg, opts) {
  const {
    titulo = "Archivo",
    info = "",
    miniatura = "",
    opciones = opcionesVideo(),
    resolver,
    porFila = 2,
    enlace = ""
  } = opts;

  registrarBotones(conn);
  limpiarViejos();

  const clave = nuevaClave();
  trabajos.set(clave, {
    chatId: msg.chatId,
    autorId: String(msg.senderId),
    citado: msg,
    titulo,
    enlace,
    opciones,
    resolver,
    ts: Date.now(),
    ocupado: false
  });

  const teclado = {
    inline_keyboard: enFilas(
      opciones.map((o) => ({ text: o.texto, callback_data: `dl:${o.id}:${clave}` })),
      porFila
    )
  };

  const texto = `${info}\n\n👇 *Elige cómo quieres el archivo:*`.trim();

  if (miniatura) {
    try {
      return await conn.sendMessage(msg.chatId, { image: miniatura, caption: texto }, { quoted: msg, buttons: teclado });
    } catch {
      /* si la portada no carga, se manda solo el texto */
    }
  }
  return conn.sendMessage(msg.chatId, { text: texto }, { quoted: msg, buttons: teclado });
}

/* ─────────────────── Atención de los botones ─────────────────── */

function registrarBotones(conn) {
  if (!conn || conn.__botonesDescarga) return;
  conn.__botonesDescarga = true;

  conn.onCallback("dl", async (query, datos) => {
    const corte = datos.indexOf(":");
    const idOpcion = corte === -1 ? datos : datos.slice(0, corte);
    const clave = corte === -1 ? "" : datos.slice(corte + 1);

    const trabajo = trabajos.get(clave);
    if (!trabajo) {
      return conn.responderBoton(query.id, "⌛ Este menú ya venció. Vuelve a usar el comando.", true);
    }
    if (String(query.from.id) !== trabajo.autorId) {
      return conn.responderBoton(query.id, "🚫 Este menú es de otra persona. Usa tú el comando.", true);
    }
    if (trabajo.ocupado) {
      return conn.responderBoton(query.id, "⏳ Ya estoy bajando ese archivo, espera.", true);
    }

    const opcion = trabajo.opciones.find((o) => o.id === idOpcion);
    if (!opcion) return conn.responderBoton(query.id, "🤔 No reconozco esa opción.", true);

    trabajo.ocupado = true;
    const chatId = trabajo.chatId;
    await conn.responderBoton(query.id, "⏳ Descargando...");

    const aviso = await conn.sendMessage(chatId, { text: "⏳ *Descargando, espera un momento...*" }).catch(() => null);

    try {
      const resuelto = await trabajo.resolver(opcion);
      if (!resuelto) throw new Error("No obtuve el archivo");

      // El plugin ya mandó los archivos por su cuenta (carruseles, packs...)
      if (resuelto.yaEnviado) {
        if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id).catch(() => {});
        return;
      }

      let { buffer, tam } = resuelto;
      if (!buffer) ({ buffer, tam } = await descargarBuffer(resuelto.url, { referer: resuelto.referer }));
      if (!tam) tam = buffer.length;

      const nombre = limpiarNombre(resuelto.nombre || trabajo.titulo, "archivo");
      const nombreFinal = /\.[a-z0-9]{2,4}$/i.test(nombre) ? nombre : `${nombre}.${extPorTipo(opcion, resuelto)}`;
      const pie = `${resuelto.caption || `📥 *${resuelto.titulo || trabajo.titulo}*`}\n📦 ${pesar(tam)}`;

      if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id).catch(() => {});

      const contenido = { fileName: nombreFinal, caption: pie };

      if (opcion.tipo === "documento") contenido.document = buffer;
      else if (opcion.tipo === "audio") {
        contenido.audio = buffer;
        contenido.title = resuelto.titulo || trabajo.titulo;
        if (resuelto.autor) contenido.performer = resuelto.autor;
      } else if (opcion.tipo === "imagen") contenido.image = buffer;
      else contenido.video = buffer;

      await conn.sendMessage(chatId, contenido, { quoted: trabajo.citado });
    } catch (e) {
      if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id).catch(() => {});
      await conn.sendMessage(chatId, {
        text:
          `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_` +
          (trabajo.enlace ? `\n\n🔗 Puedes verlo aquí: ${trabajo.enlace}` : "")
      }, { quoted: trabajo.citado }).catch(() => {});
    } finally {
      trabajo.ocupado = false;
    }
  });
}

/** Extensión según lo que se pidió */
function extPorTipo(opcion, resuelto) {
  if (resuelto?.ext) return resuelto.ext;
  if (opcion.tipo === "audio") return "mp3";
  if (opcion.tipo === "imagen") return "jpg";
  if (opcion.tipo === "documento") return resuelto?.audio ? "mp3" : "mp4";
  return "mp4";
}

export default {
  menuDescarga,
  opcionesVideo,
  opcionesAudio,
  opcionesImagen,
  opcionesArchivo,
  opcionesYoutubeVideo,
  CALIDADES_YT,
  limpiarNombre,
  MAX_SUBIDA
};
