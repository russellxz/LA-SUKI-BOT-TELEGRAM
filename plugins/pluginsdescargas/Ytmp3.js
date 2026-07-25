// plugins/pluginsdescargas/Ytmp3.js — Audio de YouTube, con botones
//
// Igual que en el bot de WhatsApp: primero llega una vista previa con el título
// y dos botones (🎵 Audio / 📄 Audio Documento) y el archivo solo se baja cuando
// eliges. La API es la misma: neoxr /youtube con type=audio&quality=128kbps.
import { buscarYoutube, audioYoutube } from "../../libs/descargas.js";
import { menuDescarga, opcionesAudio, limpiarNombre } from "../../libs/botonesdescarga.js";

const esYoutube = (u = "") => /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i.test(u);

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text:
        `🎵 *Descargar audio de YouTube*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace o nombre>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://youtu.be/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    let url = entrada;
    let video = null;

    if (!esYoutube(entrada)) {
      const resultados = await buscarYoutube(entrada, 1);
      if (!resultados.length) throw new Error("No encontré esa canción");
      video = resultados[0];
      url = video.url;
    } else {
      video = (await buscarYoutube(entrada, 1).catch(() => []))[0] || null;
    }

    const titulo = video?.titulo || "YouTube Audio";

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  🎵 *YOUTUBE — AUDIO*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 *Título:* ${titulo}\n` +
      (video?.autor ? `👤 *Canal:* ${video.autor}\n` : "") +
      (video?.duracion ? `⏱️ *Duración:* ${video.duracion}\n` : "") +
      (video?.vistas ? `👁️ *Vistas:* ${Number(video.vistas).toLocaleString("es")}\n` : "") +
      `\n🔗 ${url}`;

    await menuDescarga(conn, msg, {
      titulo,
      info,
      miniatura: video?.miniatura || "",
      enlace: url,
      opciones: opcionesAudio(),
      resolver: async () => {
        const resuelto = await audioYoutube(url);
        return {
          url: resuelto.url,
          titulo: resuelto.titulo || titulo,
          autor: video?.autor || resuelto.autor || "YouTube",
          nombre: `${limpiarNombre(resuelto.titulo || titulo, "audio")}.mp3`,
          ext: "mp3"
        };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude preparar el audio.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp3", "yta", "yt3", "ytmp33", "yt1", "yt2", "audio"];
export default handler;
