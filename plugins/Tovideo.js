// plugins/Tovideo.js — Convertir un sticker animado en video MP4
import { webmToMp4, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || msg.media;

  if (!media || !["sticker", "gif"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `🎬 *Responde a un sticker animado o a un GIF* con *${usedPrefix}${command}*.`
    }, { quoted: msg });
  }

  if (!hayFfmpeg()) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Falta ffmpeg en el servidor*, no puedo convertir a video."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const video = await webmToMp4(buffer, media.ext || "webm");
    await conn.sendMessage(chatId, {
      video,
      fileName: "video.mp4",
      caption: "🎬 Aquí tienes tu video."
    }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude convertirlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tovideo", "tomp4"];
export default handler;
