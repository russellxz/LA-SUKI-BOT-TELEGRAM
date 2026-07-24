// plugins/pluginsdescargas/Play.js — Buscar y descargar de YouTube
//
// .play <nombre>  → muestra el resultado con botones para elegir audio o video
import { buscarYoutube, resolverYoutube } from "../../libs/descargas.js";

// Guarda lo que eligió cada usuario: "chat:usuario" → { url, titulo, miniatura }
const pendientes = new Map();

const teclado = (clave) => ({
  inline_keyboard: [
    [
      { text: "🎵 Audio MP3", callback_data: `play:audio:${clave}` },
      { text: "🎬 Video 360p", callback_data: `play:360p:${clave}` }
    ],
    [
      { text: "📺 Video 720p", callback_data: `play:720p:${clave}` },
      { text: "🔗 Solo el enlace", callback_data: `play:link:${clave}` }
    ]
  ]
});

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
      video = { titulo: "Video de YouTube", url: consulta, duracion: "?", autor: "", miniatura: "", vistas: 0 };
      const resultados = await buscarYoutube(consulta, 1).catch(() => []);
      if (resultados[0]) video = resultados[0];
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
      text: `❌ No pude buscar eso.\n\n_${String(e?.message || e || "error desconocido").slice(0, 200)}_`
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

    await conn.responderBoton(query.id, "⏳ Descargando, espera un momento...");

    try {
      const esAudio = opcion === "audio";
      const resultado = await resolverYoutube(video.url, esAudio ? "audio" : "video", esAudio ? "mp3" : opcion);

      if (esAudio) {
        await conn.sendMessage(chatId, {
          audio: { url: resultado.url },
          fileName: `${video.titulo}.mp3`.replace(/[\\/:*?"<>|]/g, ""),
          title: video.titulo,
          performer: video.autor || "YouTube"
        });
      } else {
        await conn.sendMessage(chatId, {
          video: { url: resultado.url },
          fileName: `${video.titulo}.mp4`.replace(/[\\/:*?"<>|]/g, ""),
          caption: `🎬 *${video.titulo}*\n📺 Calidad: ${opcion}`
        });
      }
    } catch (e) {
      await conn.sendMessage(chatId, {
        text:
          `❌ No pude descargarlo.\n\n_${String(e?.message || e || "error desconocido").slice(0, 200)}_\n\n` +
          `🔗 Puedes verlo aquí: ${video.url}`
      });
    }
  });

  // Limpieza de búsquedas viejas
  setInterval(() => {
    const limite = Date.now() - 20 * 60 * 1000;
    for (const [k, v] of pendientes) if (v.ts < limite) pendientes.delete(k);
  }, 600000);
};

export default handler;
