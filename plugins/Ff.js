// plugins/Ff.js — Optimizar/reparar un video
import { ffmpeg, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);

  if (!media || !["video", "gif", "documento"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `🎬 *Responde a un video* con *${usedPrefix}${command}* para optimizarlo.`
    }, { quoted: msg });
  }

  if (!hayFfmpeg()) {
    return conn.sendMessage(chatId, { text: "⚠️ *Falta ffmpeg en el servidor.*" }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  const inicio = Date.now();

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const salida = await ffmpeg(
      buffer,
      [
        "-c:v", "libx264", "-preset", "fast", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-movflags", "+faststart", "-pix_fmt", "yuv420p",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2"
      ],
      media.ext || "mp4",
      "mp4"
    );

    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
    await conn.sendMessage(chatId, {
      video: salida,
      fileName: "video_optimizado.mp4",
      caption:
        `✅ *Video optimizado*\n\n` +
        `📏 Antes: ${(buffer.length / 1048576).toFixed(2)} MB\n` +
        `📏 Ahora: ${(salida.length / 1048576).toFixed(2)} MB\n` +
        `⏱️ Tardé ${segundos}s`
    }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude procesar el video.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ff", "optimizarvideo"];
export default handler;
