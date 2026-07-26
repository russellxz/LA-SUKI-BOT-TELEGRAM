/**
 * libs/botonesdescarga.js — Menú de botones para todos los comandos de descarga.
 *
 * Cómo se ve en el chat (y por qué no hace spam):
 *
 *   1. Llega UNA tarjeta con la portada, la ficha y los botones.
 *   2. Al pulsar, la propia tarjeta se edita: "⏳ Bajando audio…". No se manda
 *      ningún mensaje nuevo — en Telegram se pueden editar los mensajes ya
 *      enviados, así que se aprovecha.
 *   3. Llega el archivo.
 *   4. La tarjeta se edita otra vez marcando lo que ya se descargó, con los
 *      botones puestos por si quieres otro formato.
 *
 *   Total: 2 mensajes (tarjeta + archivo). Antes eran 4.
 *
 * Uso desde un plugin:
 *
 *   await menuDescarga(conn, msg, {
 *     emoji: "🎵", fuente: "YOUTUBE",
 *     nombre: "Bad Bunny - Diles",
 *     datos: [["👤", "Canal", "Bad Bunny"], ["⏱️", "Duración", "3:24"]],
 *     miniatura: "https://...",
 *     opciones: opcionesAudio(),
 *     resolver: async (opcion) => ({ url, nombre: "cancion.mp3" })
 *   });
 */

import { descargarBuffer, MAX_SUBIDA } from "./descargas.js";
import { ficha, peso, recortar } from "./estilo.js";

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

/* ─────────────── Juegos de botones más usados ─────────────── */

/** Video normal / Video documento (Facebook, TikTok, Twitter, Instagram...) */
export const opcionesVideo = () => [
  { id: "v", texto: "🎬 Video", tipo: "video" },
  { id: "vd", texto: "📄 Documento", tipo: "documento" }
];

/** Audio normal / Audio documento (YouTube mp3, Spotify...) */
export const opcionesAudio = () => [
  { id: "a", texto: "🎵 Audio", tipo: "audio" },
  { id: "ad", texto: "📄 Documento", tipo: "documento", audio: true }
];

/** Foto normal / Foto documento (Pinterest, Instagram de fotos...) */
export const opcionesImagen = () => [
  { id: "i", texto: "🖼️ Imagen", tipo: "imagen" },
  { id: "idoc", texto: "📄 Documento", tipo: "documento" }
];

/** Documento suelto (MediaFire, APK...) */
export const opcionesArchivo = () => [
  { id: "f", texto: "📥 Descargar", tipo: "documento" }
];

/** Calidades de video de YouTube, en normal y en documento */
export const CALIDADES_YT = ["144", "240", "360", "720", "1080", "1440", "4k"];

export const opcionesYoutubeVideo = (calidades = ["360", "720", "1080"]) => [
  ...calidades.map((q) => ({ id: `v${q}`, texto: `🎬 ${q === "4k" ? "4K" : `${q}p`}`, tipo: "video", calidad: q })),
  ...calidades.map((q) => ({ id: `d${q}`, texto: `📄 ${q === "4k" ? "4K" : `${q}p`}`, tipo: "documento", calidad: q }))
];

/* ─────────────────────── Menú ─────────────────────── */

function enFilas(botones, porFila) {
  const filas = [];
  for (let i = 0; i < botones.length; i += porFila) filas.push(botones.slice(i, i + porFila));
  return filas;
}

/** Arma el teclado marcando con ✓ lo que ya se descargó */
function teclado(trabajo) {
  return {
    inline_keyboard: enFilas(
      trabajo.opciones.map((o) => ({
        text: trabajo.hechos.has(o.id) ? `✓ ${o.texto}` : o.texto,
        callback_data: `dl:${o.id}:${trabajo.clave}`
      })),
      trabajo.porFila
    )
  };
}

/** El texto de la tarjeta según en qué punto esté */
function tarjeta(trabajo) {
  const base = ficha({
    emoji: trabajo.emoji,
    fuente: trabajo.fuente,
    nombre: trabajo.nombre,
    datos: trabajo.datos,
    enlace: trabajo.enlace
  });

  if (trabajo.estado) return `${base}\n\n${trabajo.estado}`;
  return `${base}\n\n👇 _Elige el formato_`;
}

/**
 * Manda la tarjeta con los botones y deja el trabajo apuntado.
 *
 * @param {object} conn
 * @param {object} msg   mensaje que disparó el comando
 * @param {object} opts
 *   emoji, fuente  → "🎵", "YOUTUBE"  (cabecera de la ficha)
 *   nombre         → título de lo que se va a bajar
 *   datos          → [["👤","Canal","Bad Bunny"], ...]
 *   miniatura      → url de la portada (opcional)
 *   opciones       → botones: [{ id, texto, tipo, calidad }]
 *   resolver       → async (opcion) => { url | buffer, nombre, titulo?, caption? }
 *   porFila        → cuántos botones por fila
 *   enlace         → url original, por si falla la descarga
 */
export async function menuDescarga(conn, msg, opts) {
  const {
    emoji = "📦",
    fuente = "ARCHIVO",
    nombre = "Archivo",
    titulo,               // compatibilidad con las llamadas antiguas
    datos = [],
    info,                 // idem: texto ya armado
    miniatura = "",
    opciones = opcionesVideo(),
    resolver,
    porFila = 2,
    enlace = ""
  } = opts;

  registrarBotones(conn);
  limpiarViejos();

  const clave = nuevaClave();
  const trabajo = {
    clave,
    chatId: msg.chatId,
    autorId: String(msg.senderId),
    citado: msg,
    emoji,
    fuente,
    nombre: nombre || titulo || "Archivo",
    titulo: titulo || nombre,
    datos,
    infoFija: info || null,
    enlace,
    opciones,
    porFila,
    resolver,
    hechos: new Set(),
    estado: "",
    ts: Date.now(),
    ocupado: false
  };
  trabajos.set(clave, trabajo);

  const texto = trabajo.infoFija
    ? `${trabajo.infoFija}\n\n👇 _Elige el formato_`
    : tarjeta(trabajo);

  let enviado = null;
  if (miniatura) {
    try {
      enviado = await conn.sendMessage(msg.chatId, { image: miniatura, caption: texto }, { quoted: msg, buttons: teclado(trabajo) });
      trabajo.esMedia = true;
    } catch {
      /* si la portada no carga, se manda solo el texto */
    }
  }
  if (!enviado) {
    enviado = await conn.sendMessage(msg.chatId, { text: texto }, { quoted: msg, buttons: teclado(trabajo) });
    trabajo.esMedia = false;
  }

  trabajo.mensajeId = enviado?.message_id ?? enviado?.messageId ?? null;
  return enviado;
}

/* ─────────────────── Atención de los botones ─────────────────── */

/** Repinta la tarjeta sin mandar nada nuevo */
async function repintar(conn, trabajo) {
  if (!trabajo.mensajeId) return;
  const texto = trabajo.infoFija
    ? `${trabajo.infoFija}${trabajo.estado ? `\n\n${trabajo.estado}` : "\n\n👇 _Elige el formato_"}`
    : tarjeta(trabajo);
  await conn.editar(trabajo.chatId, trabajo.mensajeId, texto, {
    esMedia: trabajo.esMedia,
    buttons: teclado(trabajo)
  });
}

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

    // El aviso va como globito de Telegram: no ensucia el chat
    await conn.responderBoton(query.id, `⏳ Bajando ${opcion.texto.replace(/^\S+\s*/, "")}…`);

    trabajo.estado = `⏳ _Bajando ${opcion.texto.replace(/^\S+\s*/, "").toLowerCase()}…_`;
    await repintar(conn, trabajo);
    conn.sendPresenceUpdate("typing", chatId).catch(() => {});

    try {
      const resuelto = await trabajo.resolver(opcion);
      if (!resuelto) throw new Error("No obtuve el archivo");

      // El plugin ya mandó los archivos por su cuenta (carruseles, packs...)
      if (resuelto.yaEnviado) {
        trabajo.hechos.add(opcion.id);
        trabajo.estado = `✅ _Listo_`;
        await repintar(conn, trabajo);
        return;
      }

      let { buffer, tam } = resuelto;
      if (!buffer) ({ buffer, tam } = await descargarBuffer(resuelto.url, { referer: resuelto.referer }));
      if (!tam) tam = buffer.length;

      const nombreArchivo = limpiarNombre(resuelto.nombre || trabajo.nombre, "archivo");
      const nombreFinal = /\.[a-z0-9]{2,4}$/i.test(nombreArchivo)
        ? nombreArchivo
        : `${nombreArchivo}.${extPorTipo(opcion, resuelto)}`;

      // Pie del archivo: corto y al grano, la ficha completa ya está arriba
      const pie = resuelto.caption ?? `${trabajo.emoji} *${recortar(resuelto.titulo || trabajo.nombre, 60)}*`;

      const contenido = { fileName: nombreFinal, caption: pie };
      if (opcion.tipo === "documento") contenido.document = buffer;
      else if (opcion.tipo === "audio") {
        contenido.audio = buffer;
        contenido.title = resuelto.titulo || trabajo.nombre;
        if (resuelto.autor) contenido.performer = resuelto.autor;
      } else if (opcion.tipo === "imagen") contenido.image = buffer;
      else contenido.video = buffer;

      await conn.sendMessage(chatId, contenido, { quoted: trabajo.citado });

      trabajo.hechos.add(opcion.id);
      trabajo.estado = `✅ _${opcion.texto.replace(/^\S+\s*/, "")} enviado · ${peso(tam)}_`;
      await repintar(conn, trabajo);
    } catch (e) {
      trabajo.estado =
        `❌ _${String(e?.message || e).slice(0, 140)}_` +
        (trabajo.enlace ? `\n🔗 ${trabajo.enlace}` : "");
      await repintar(conn, trabajo);
    } finally {
      trabajo.ocupado = false;
    }
  });
}

/** Extensión según lo que se pidió */
function extPorTipo(opcion, resuelto) {
  if (resuelto?.ext) return resuelto.ext;
  if (opcion.tipo === "audio" || opcion.audio) return "mp3";
  if (opcion.tipo === "imagen") return "jpg";
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
