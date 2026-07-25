// plugins/pluginsdescargas/Play.js — Buscar y descargar de YouTube
//
// El bot descarga el archivo él mismo (las APIs piden clave en la cabecera y
// Telegram no puede hacerlo por su cuenta) y luego sube los bytes.
import { buscarYoutube, audioYoutube, videoYoutube, descargarBuffer } from "../../libs/descargas.js";

// Lo que eligió cada usuario: "chat:usuario" → { url, titulo, ... }
const pendientes = new Map();

const teclado = (clave) => ({
  inline_keyboard: [
    [
      { text: "🎵 Audio MP3", callback_data: `play:audio:${clave}` },
      { text: "🎬 Video 360p", callback_data: `play:360:${clave}` }
    ],
    [
      { text: "📺 Video 720p", callback_data: `play:720:${clave}` },
      { text: "📁 Audio como archivo", callback_data: `play:audiodoc:${clave}` }
    ],
    [{ text: "🔗 Solo el enlace", callback_data: `play:link:${clave}` }]
  ]
});

const limpiarNombre = (t) => String(t).replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim() || "audio";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const consulta = (text || "").trim();

  if (!consulta) {
    return conn.sendMessage(chatId, {
      text:
        `🎵 *Buscar y descargar de YouTube*\n\n` +
        `Usa: *${usedPrefix}${command} <nombre o enlace>*\n\n` +
        `*Ejemplos:*\n• ${usedPrefix}${command} bad bunny diles\n• ${usedPrefix}${command} https://youtu.be/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const esEnlace = /youtu\.?be|youtube\.com/i.test(consulta);
    let video;

    if (esEnlace) {
      const resultados = await buscarYoutube(consulta, 1).catch(() => []);
      video = resultados[0] || { titulo: "Video de YouTube", url: consulta, duracion: "", autor: "", miniatura: "", vistas: 0 };
      video.url = resultados[0]?.url || consulta;
    } else {
      const resultados = await buscarYoutube(consulta, 1);
      if (!resultados.length) throw new Error("No encontré nada con ese nombre");
      video = resultados[0];
    }

    const clave = `${chatId}:${msg.senderId}`;
    pendientes.set(clave, { ...video, ts: Date.now() });

    const info =
      `🎵 *${video.titulo}*\n\n` +
      (video.autor ? `👤 Canal: ${video.autor}\n` : "") +
      (video.duracion ? `⏱️ Duración: ${video.duracion}\n` : "") +
      (video.vistas ? `👁️ Vistas: ${Number(video.vistas).toLocaleString("es")}\n` : "") +
      (video.subido ? `📅 Publicado: ${video.subido}\n` : "") +
      `\n🔗 ${video.url}\n\n` +
      "👇 *Elige qué quieres descargar:*";

    if (video.miniatura) {
      await conn.sendMessage(chatId, { image: video.miniatura, caption: info }, { quoted: msg, buttons: teclado(clave) });
    } else {
      await conn.sendMessage(chatId, { text: info }, { quoted: msg, buttons: teclado(clave) });
    }

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude buscar eso.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["play", "play2", "playtest", "musica"];

handler.iniciar = (conn) => {
  conn.onCallback("play", async (query, datos) => {
    const [opcion, ...resto] = datos.split(":");
    const clave = resto.join(":");
    const chatId = query.message.chat.id;

    if (!clave.endsWith(`:${query.from.id}`)) {
      return conn.responderBoton(query.id, "🚫 Esta búsqueda es de otra persona. Haz la tuya con .play", true);
    }

    const video = pendientes.get(clave);
    if (!video) {
      return conn.responderBoton(query.id, "⌛ Se venció esta búsqueda, vuelve a usar .play", true);
    }

    if (opcion === "link") {
      await conn.responderBoton(query.id);
      return conn.sendMessage(chatId, { text: `🔗 *${video.titulo}*\n${video.url}` });
    }

    const esAudio = opcion === "audio" || opcion === "audiodoc";
    await conn.responderBoton(query.id, esAudio ? "🎵 Bajando el audio..." : "🎬 Bajando el video...");

    const aviso = await conn.sendMessage(chatId, {
      text: esAudio ? "⏳ *Descargando el audio...*" : `⏳ *Descargando el video (${opcion}p)...*`
    });

    try {
      const resuelto = esAudio
        ? await audioYoutube(video.url)
        : await videoYoutube(video.url, opcion);

      // El bot baja el archivo y sube los bytes: así Telegram no depende de la API
      const { buffer, tam } = await descargarBuffer(resuelto.url);
      const titulo = resuelto.titulo || video.titulo;

      if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id);

      if (opcion === "audiodoc") {
        await conn.sendMessage(chatId, {
          document: buffer,
          fileName: `${limpiarNombre(titulo)}.mp3`,
          caption: `🎵 *${titulo}*\n📦 ${(tam / 1048576).toFixed(1)} MB`
        });
      } else if (esAudio) {
        await conn.sendMessage(chatId, {
          audio: buffer,
          fileName: `${limpiarNombre(titulo)}.mp3`,
          title: titulo,
          performer: video.autor || "YouTube",
          caption: `🎵 *${titulo}*`
        });
      } else {
        await conn.sendMessage(chatId, {
          video: buffer,
          fileName: `${limpiarNombre(titulo)}.mp4`,
          caption: `🎬 *${titulo}*\n📺 Calidad: ${opcion}p\n📦 ${(tam / 1048576).toFixed(1)} MB`
        });
      }
    } catch (e) {
      if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id);
      await conn.sendMessage(chatId, {
        text:
          `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_\n\n` +
          `🔗 Puedes verlo aquí: ${video.url}`
      });
    }
  });

  setInterval(() => {
    const limite = Date.now() - 20 * 60 * 1000;
    for (const [k, v] of pendientes) if (v.ts < limite) pendientes.delete(k);
  }, 600000);
};

export default handler;
