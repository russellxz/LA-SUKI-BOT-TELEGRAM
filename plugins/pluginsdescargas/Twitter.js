// plugins/pluginsdescargas/Twitter.js — Descargar de Twitter / X
import { descargarTwitter, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = (text || "").trim();

  if (!url || !/twitter\.com|x\.com|t\.co/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `🐦 *Descargar de Twitter / X*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://x.com/usuario/status/123`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarTwitter(url);

    if (datos.video) {
      const { buffer, tam } = await descargarBuffer(datos.video);
      await conn.sendMessage(chatId, {
        video: buffer,
        fileName: "twitter.mp4",
        caption: `🐦 *Twitter / X*\n${datos.titulo || ""}\n📦 ${(tam / 1048576).toFixed(1)} MB`.trim()
      }, { quoted: msg });
    } else if (datos.imagen) {
      const { buffer } = await descargarBuffer(datos.imagen);
      await conn.sendMessage(chatId, {
        image: buffer,
        caption: `🐦 *Twitter / X*\n${datos.titulo || ""}`.trim()
      }, { quoted: msg });
    } else {
      throw new Error("Ese tweet no tiene video ni imagen");
    }

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["twitter", "tw", "xdl", "x"];
export default handler;
