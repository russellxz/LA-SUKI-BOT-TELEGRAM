// plugins/pluginsdescargas/Ytmp3.js — Audio de YouTube, con botones
//
// Igual que en el bot de WhatsApp: primero llega una vista previa con el título
// y dos botones (🎵 Audio / 📄 Audio Documento) y el archivo solo se baja cuando
// eliges. La API es la misma: neoxr /youtube con type=audio&quality=128kbps.
import { buscarYoutube, audioYoutube } from "../../libs/descargas.js";
import { menuDescarga, opcionesAudio, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, duracion, numero, recortar } from "../../libs/estilo.js";

const esYoutube = (u = "") => /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i.test(u);

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "🎵",
        nombre: "Audio de YouTube",
        para: "Te bajo el audio de cualquier video o canción.",
        usos: [`${usedPrefix}${command} <enlace o nombre>`],
        ejemplos: [`${usedPrefix}${command} https://youtu.be/xxxx`, `${usedPrefix}${command} bad bunny diles`]
      })
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

    await menuDescarga(conn, msg, {
      emoji: "🎵",
      fuente: "YouTube · Audio",
      nombre: titulo,
      miniatura: video?.miniatura || "",
      enlace: url,
      datos: [
        ["👤", "Canal", video?.autor || null],
        ["⏱️", "Duración", video?.duracion || (video?.segundos ? duracion(video.segundos) : null)],
        ["👁️", "Vistas", video?.vistas ? numero(video.vistas) : null]
      ],
      opciones: opcionesAudio(),
      resolver: async () => {
        const resuelto = await audioYoutube(url);
        return {
          url: resuelto.url,
          titulo: resuelto.titulo || titulo,
          autor: video?.autor || resuelto.autor || "YouTube",
          nombre: `${limpiarNombre(resuelto.titulo || titulo, "audio")}.mp3`,
          ext: "mp3",
          caption: `🎵 *${recortar(resuelto.titulo || titulo, 60)}*${video?.autor ? `\n👤 ${video.autor}` : ""}`
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
