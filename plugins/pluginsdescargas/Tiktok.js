// plugins/pluginsdescargas/Tiktok.js — Descargar de TikTok sin marca de agua
import { descargarTiktok, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = (text || "").trim();

  if (!url || !/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `🎵 *Descargar de TikTok*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace de TikTok>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://vm.tiktok.com/xxxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarTiktok(url);

    // Publicaciones de solo fotos
    if (!datos.video && datos.imagenes?.length) {
      for (const imagen of datos.imagenes.slice(0, 10)) {
        const enlace = typeof imagen === "string" ? imagen : imagen.url;
        try {
          const { buffer } = await descargarBuffer(enlace);
          await conn.sendMessage(chatId, { image: buffer });
        } catch {
          await conn.sendMessage(chatId, { image: enlace });
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (datos.audio) {
        try {
          const { buffer } = await descargarBuffer(datos.audio);
          await conn.sendMessage(chatId, { audio: buffer, fileName: "tiktok.mp3", title: datos.titulo });
        } catch {}
      }
      return conn.react(chatId, msg.message_id, "✅");
    }

    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    const { buffer, tam } = await descargarBuffer(datos.video);

    await conn.sendMessage(chatId, {
      video: buffer,
      fileName: "tiktok.mp4",
      caption:
        `🎵 *TikTok descargado*\n\n` +
        (datos.titulo ? `📝 ${datos.titulo}\n` : "") +
        (datos.autor ? `👤 ${datos.autor}\n` : "") +
        `📦 ${(tam / 1048576).toFixed(1)} MB`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tiktok", "tt", "tiktok2", "tt2", "ttt", "tiktoktest"];
export default handler;
