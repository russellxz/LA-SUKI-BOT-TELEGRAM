// plugins/pluginsdescargas/Ig.js — Descargar fotos y videos de Instagram
import { descargarInstagram, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = (text || "").trim();

  if (!url || !/instagram\.com/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `📸 *Descargar de Instagram*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://www.instagram.com/p/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const lista = await descargarInstagram(url);
    const items = lista.filter(Boolean).slice(0, 10);
    if (!items.length) throw new Error("No encontré nada en ese enlace");

    let enviados = 0;
    for (const item of items) {
      const enlace = typeof item === "string" ? item : (item.url || item.link || item.download);
      if (!enlace) continue;

      const esVideo = /\.mp4|video/i.test(item?.type || enlace);
      try {
        const { buffer } = await descargarBuffer(enlace);
        await conn.sendMessage(chatId, esVideo
          ? { video: buffer, fileName: "instagram.mp4", caption: "📸 *Instagram*" }
          : { image: buffer, caption: "📸 *Instagram*" }
        , { quoted: msg });
        enviados++;
      } catch (e) {
        console.log("⚠️ ig:", e.message);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!enviados) throw new Error("No pude bajar ninguno de los archivos");
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_\n\n_Las cuentas privadas no se pueden descargar._`
    }, { quoted: msg });
  }
};

handler.command = ["instagram", "ig"];
export default handler;
