// plugins/Toaudio.js — Convertir un video o nota de voz en audio MP3
import { toAudio, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || msg.media;

  if (!media || !["video", "nota", "audio", "gif", "documento"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `🎵 *Responde a un video o nota de voz* con *${usedPrefix}${command}* para sacarle el audio.`
    }, { quoted: msg });
  }

  if (!hayFfmpeg()) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Falta ffmpeg en el servidor*, no puedo convertir el audio."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const audio = await toAudio(buffer, media.ext || "mp4");
    await conn.sendMessage(chatId, {
      audio,
      fileName: "audio.mp3",
      title: "Audio convertido",
      performer: "La Suki Bot"
    }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude convertirlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["toaudio", "tomp3"];
export default handler;
