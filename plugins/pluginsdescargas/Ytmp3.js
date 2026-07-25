// plugins/pluginsdescargas/Ytmp3.js — Descargar el audio de un video de YouTube
import { buscarYoutube, audioYoutube, descargarBuffer } from "../../libs/descargas.js";

const limpiarNombre = (t) => String(t).replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim() || "audio";

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

    const resuelto = await audioYoutube(url);
    titulo = resuelto.titulo || titulo;

    const { buffer, tam } = await descargarBuffer(resuelto.url);

    await conn.sendMessage(chatId, {
      audio: buffer,
      fileName: `${limpiarNombre(titulo)}.mp3`,
      title: titulo,
      performer: autor || "YouTube",
      caption: `🎵 *${titulo}*\n📦 ${(tam / 1048576).toFixed(1)} MB`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargar el audio.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp3", "yta", "yt3", "ytmp33", "yt1", "yt2", "audio"];
export default handler;
