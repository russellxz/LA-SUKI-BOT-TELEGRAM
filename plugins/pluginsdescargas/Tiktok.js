// plugins/pluginsdescargas/Tiktok.js — Descargar videos de TikTok sin marca de agua
import { descargarTiktok } from "../../libs/descargas.js";

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
        await conn.sendMessage(chatId, { image: typeof imagen === "string" ? imagen : imagen.url });
        await new Promise((r) => setTimeout(r, 400));
      }
      if (datos.audio) {
        await conn.sendMessage(chatId, { audio: { url: datos.audio }, fileName: "tiktok.mp3", title: datos.titulo });
      }
      return conn.react(chatId, msg.message_id, "✅");
    }

    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    await conn.sendMessage(chatId, {
      video: { url: datos.video },
      fileName: "tiktok.mp4",
      caption:
        `🎵 *TikTok descargado*\n\n` +
        (datos.titulo ? `📝 ${datos.titulo}\n` : "") +
        (datos.autor ? `👤 ${datos.autor}` : "")
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tiktok", "tt", "tiktok2", "tt2", "ttt", "tiktoktest"];
export default handler;
