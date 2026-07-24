// plugins/pluginsdescargas/Fb.js — Descargar videos de Facebook
import { descargarFacebook } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = (text || "").trim();

  if (!url || !/facebook\.com|fb\.watch|fb\.me/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `📘 *Descargar de Facebook*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://fb.watch/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarFacebook(url);
    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    await conn.sendMessage(chatId, {
      video: { url: datos.video },
      fileName: "facebook.mp4",
      caption: `📘 *Facebook*\n${datos.titulo || ""}`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["facebook", "fb"];
export default handler;
