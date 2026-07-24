// plugins/pluginsdescargas/Ytmp4.js — Descargar el video de YouTube
import { buscarYoutube, resolverYoutube } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text:
        `🎬 *Descargar video de YouTube*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace o nombre>*\n\n` +
        `_Puedes pedir calidad: ${usedPrefix}${command} 720p <enlace>_`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    // Calidad opcional como primer argumento
    let calidad = "360p";
    let consulta = entrada;
    const posible = args[0];
    if (/^\d{3,4}p$/.test(posible || "")) {
      calidad = posible;
      consulta = args.slice(1).join(" ");
    }

    let url = consulta;
    let titulo = "YouTube";

    if (!/youtu\.?be|youtube\.com/i.test(consulta)) {
      const resultados = await buscarYoutube(consulta, 1);
      if (!resultados.length) throw new Error("No encontré ese video");
      url = resultados[0].url;
      titulo = resultados[0].titulo;
    }

    const resultado = await resolverYoutube(url, "video", calidad);
    titulo = resultado.titulo || titulo;

    await conn.sendMessage(chatId, {
      video: { url: resultado.url },
      fileName: `${titulo}.mp4`.replace(/[\\/:*?"<>|]/g, ""),
      caption: `🎬 *${titulo}*\n📺 Calidad: ${calidad}`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargar el video.\n\n_${String(e?.message || e || "error desconocido").slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp4", "ytv", "yt4", "y4", "video"];
export default handler;
