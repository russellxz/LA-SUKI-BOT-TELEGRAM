// plugins/Ff2.js — Reparar/convertir un audio dañado
import { ffmpeg, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);

  if (!media || !["audio", "nota", "documento", "video"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `🎧 *Responde a un audio o mp3 dañado* con *${usedPrefix}${command}* para repararlo.`
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
      ["-vn", "-acodec", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2", "-f", "mp3"],
      media.ext || "mp3",
      "mp3"
    );

    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
    await conn.sendMessage(chatId, {
      audio: salida,
      fileName: "audio_reparado.mp3",
      title: "Audio reparado",
      performer: "La Suki Bot",
      caption: `✅ *Audio reparado*\n⏱️ Tardé ${segundos}s`
    }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude reparar el audio.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ff2", "repararaudio"];
export default handler;
