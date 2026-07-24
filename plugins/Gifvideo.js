// plugins/Gifvideo.js — Convertir un GIF o video en GIF animado de Telegram
import { hayFfmpeg, ffmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || msg.media;

  if (!media || !["video", "gif", "sticker"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `🎞️ *Responde a un video o sticker animado* con *${usedPrefix}${command}* para convertirlo en GIF.`
    }, { quoted: msg });
  }

  if (!hayFfmpeg()) {
    return conn.sendMessage(chatId, { text: "⚠️ *Falta ffmpeg en el servidor.*" }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const salida = await ffmpeg(
      buffer,
      ["-t", "10", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2"],
      media.ext || "mp4",
      "mp4"
    );
    await conn.sendMessage(chatId, { video: salida, gifPlayback: true, fileName: "animacion.mp4" }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, { text: `❌ No pude convertirlo.\n\n_${String(e.message).slice(0, 200)}_` }, { quoted: msg });
  }
};

handler.command = ["gifvideo", "togif"];
export default handler;
