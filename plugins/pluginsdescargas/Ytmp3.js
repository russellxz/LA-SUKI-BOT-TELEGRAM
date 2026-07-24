// plugins/pluginsdescargas/Ytmp3.js — Descargar el audio de un video de YouTube
import { buscarYoutube, resolverYoutube } from "../../libs/descargas.js";

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
    let titulo = "YouTube";
    let autor = "";

    if (!/youtu\.?be|youtube\.com/i.test(entrada)) {
      const resultados = await buscarYoutube(entrada, 1);
      if (!resultados.length) throw new Error("No encontré esa canción");
      url = resultados[0].url;
      titulo = resultados[0].titulo;
      autor = resultados[0].autor;
    }

    const resultado = await resolverYoutube(url, "audio", "mp3");
    titulo = resultado.titulo || titulo;

    await conn.sendMessage(chatId, {
      audio: { url: resultado.url },
      fileName: `${titulo}.mp3`.replace(/[\\/:*?"<>|]/g, ""),
      title: titulo,
      performer: autor || "YouTube"
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargar el audio.\n\n_${String(e?.message || e || "error desconocido").slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp3", "yta", "yt3", "ytmp33", "yt1", "yt2", "audio"];
export default handler;
