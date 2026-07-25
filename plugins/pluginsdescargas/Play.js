// plugins/pluginsdescargas/Play.js — Buscar y descargar de YouTube
//
// Busca la canción y manda la vista previa con botones: audio, audio como
// documento, y video en varias calidades (normal o documento). El bot baja el
// archivo él mismo, porque las APIs piden la clave en la cabecera y Telegram
// no puede hacerlo por su cuenta.
import { buscarYoutube, audioYoutube, videoYoutube } from "../../libs/descargas.js";
import { menuDescarga, limpiarNombre } from "../../libs/botonesdescarga.js";

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
    const resultados = await buscarYoutube(consulta, 1).catch(() => []);

    let video = resultados[0];
    if (!video) {
      if (!esEnlace) throw new Error("No encontré nada con ese nombre");
      video = { titulo: "Video de YouTube", url: consulta, duracion: "", autor: "", miniatura: "", vistas: 0 };
    }
    if (esEnlace) video.url = resultados[0]?.url || consulta;

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  🎧 *YOUTUBE*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 *Título:* ${video.titulo}\n` +
      (video.autor ? `👤 *Canal:* ${video.autor}\n` : "") +
      (video.duracion ? `⏱️ *Duración:* ${video.duracion}\n` : "") +
      (video.vistas ? `👁️ *Vistas:* ${Number(video.vistas).toLocaleString("es")}\n` : "") +
      (video.subido ? `📅 *Publicado:* ${video.subido}\n` : "") +
      `\n🔗 ${video.url}`;

    await menuDescarga(conn, msg, {
      titulo: video.titulo,
      info,
      miniatura: video.miniatura || "",
      enlace: video.url,
      porFila: 2,
      opciones: [
        { id: "a", texto: "🎵 Audio MP3", tipo: "audio" },
        { id: "ad", texto: "📄 Audio Documento", tipo: "documento", audio: true },
        { id: "v360", texto: "🎬 Video 360p", tipo: "video", calidad: "360" },
        { id: "d360", texto: "📁 360p Documento", tipo: "documento", calidad: "360" },
        { id: "v720", texto: "📺 Video 720p", tipo: "video", calidad: "720" },
        { id: "d720", texto: "📁 720p Documento", tipo: "documento", calidad: "720" }
      ],
      resolver: async (opcion) => {
        const esAudio = opcion.tipo === "audio" || opcion.audio;

        if (esAudio) {
          const resuelto = await audioYoutube(video.url);
          return {
            url: resuelto.url,
            titulo: resuelto.titulo || video.titulo,
            autor: video.autor || "YouTube",
            nombre: `${limpiarNombre(resuelto.titulo || video.titulo, "audio")}.mp3`,
            ext: "mp3",
            audio: true,
            caption: `🎵 *${resuelto.titulo || video.titulo}*`
          };
        }

        const resuelto = await videoYoutube(video.url, opcion.calidad || "360");
        const etiqueta = resuelto.calidad === "4k" ? "4K" : `${resuelto.calidad}p`;
        return {
          url: resuelto.url,
          titulo: resuelto.titulo || video.titulo,
          nombre: `${limpiarNombre(resuelto.titulo || video.titulo, "video")}.mp4`,
          ext: "mp4",
          caption: `🎬 *${resuelto.titulo || video.titulo}*\n📺 Calidad: ${etiqueta}`
        };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude buscar eso.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["play", "play2", "playtest", "musica"];
export default handler;
