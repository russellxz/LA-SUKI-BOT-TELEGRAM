// plugins/S.js — Crear stickers a partir de fotos, videos, GIFs o documentos
//
// Telegram acepta dos formatos:
//   • estático  → WEBP de 512x512
//   • animado   → WEBM (VP9) de máximo 3 segundos y 256 KB
import { imageToWebp, videoToWebm, hayFfmpeg, MAX_STICKER_WEBM } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;

  const media = msg.media && msg.tipo !== "texto" ? msg.media : msg.quoted?.media;

  if (!media || !["imagen", "video", "gif", "documento", "sticker"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text:
        "🎨 *Crear sticker*\n\n" +
        `Responde a una *foto*, *video*, *GIF* o *sticker* con *${usedPrefix}${command}*.\n\n` +
        "_Los videos se recortan a 3 segundos (límite de Telegram)._"
    }, { quoted: msg });
  }

  // Si ya es un sticker, se reenvía tal cual: así conserva la calidad original
  if (media.tipo === "sticker") {
    return conn.sendMessage(chatId, { sticker: media.fileId }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const esVideo =
      ["video", "gif"].includes(media.tipo) ||
      (media.tipo === "documento" && /video|gif|webm|mp4/i.test(`${media.mime} ${media.ext}`));

    if (esVideo && !hayFfmpeg()) {
      await conn.react(chatId, msg.message_id, "❌");
      return conn.sendMessage(chatId, {
        text:
          "⚠️ *No puedo convertir videos a sticker:* falta *ffmpeg* en el servidor.\n\n" +
          "_Las fotos sí funcionan. Pídele al hosting que instale ffmpeg para los animados._"
      }, { quoted: msg });
    }

    const sticker = esVideo
      ? await videoToWebm(buffer, media.ext || "mp4")
      : await imageToWebp(buffer);

    if (!sticker?.length) throw new Error("La conversión quedó vacía");

    // Telegram rechaza los stickers de video que pasen de 256 KB
    if (esVideo && sticker.length > MAX_STICKER_WEBM) {
      await conn.react(chatId, msg.message_id, "❌");
      return conn.sendMessage(chatId, {
        text:
          `⚠️ El video quedó muy pesado para ser sticker (${(sticker.length / 1024).toFixed(0)} KB de 256 KB).\n\n` +
          "_Prueba con un clip más corto o con menos movimiento._"
      }, { quoted: msg });
    }

    await conn.sendMessage(
      chatId,
      { sticker, fileName: esVideo ? "sticker.webm" : "sticker.webp" },
      { quoted: msg }
    );
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    console.error("[s] error:", e.message);
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude crear el sticker.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["s", "sticker", "stiker"];
export default handler;
