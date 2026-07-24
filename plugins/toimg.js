// plugins/toimg.js — Convertir un sticker en imagen
import { webpToImage } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || msg.media;

  if (!media || media.tipo !== "sticker") {
    return conn.sendMessage(chatId, {
      text: `🖼️ *Responde a un sticker* con *${usedPrefix}${command}* para convertirlo en imagen.`
    }, { quoted: msg });
  }

  if (media.animado) {
    return conn.sendMessage(chatId, {
      text: `🎬 Ese sticker es animado. Usa *${usedPrefix}tovideo* para convertirlo en video.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const imagen = await webpToImage(buffer);
    await conn.sendMessage(chatId, { image: imagen, fileName: "imagen.png", caption: "🖼️ Aquí tienes tu imagen." }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude convertirlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["toimg", "stickerimg", "aimagen"];
export default handler;
