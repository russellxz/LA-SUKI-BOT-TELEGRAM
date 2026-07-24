// plugins/Whatmusic.js — Identificar qué canción suena en un audio o video
import axios from "axios";
import { subirArchivo } from "../libs/subir.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);

  if (!media || !["audio", "nota", "video", "documento", "gif"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text:
        `🎵 *¿Qué canción es?*\n\n` +
        `Responde a un *audio*, *nota de voz* o *video* con *${usedPrefix}${command}*\n` +
        "y trato de reconocer la canción."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const url = await subirArchivo(buffer, `audio.${media.ext || "mp3"}`);

    const { data } = await axios.get(
      `https://api.neoxr.eu/api/whatmusic?url=${encodeURIComponent(url)}&apikey=russellxz`,
      { timeout: 120000 }
    );

    const info = data?.data;
    if (!info?.title) throw new Error("No logré reconocer la canción");

    await conn.sendMessage(chatId, {
      text:
        `🎵 *CANCIÓN IDENTIFICADA*\n\n` +
        `🎼 *Título:* ${info.title}\n` +
        (info.artists ? `🎤 *Artista:* ${info.artists}\n` : "") +
        (info.album ? `💿 *Álbum:* ${info.album}\n` : "") +
        (info.release_date ? `📅 *Publicada:* ${info.release_date}\n` : "") +
        (info.url ? `\n🔗 ${info.url}` : "") +
        `\n\n_Búscala con ${usedPrefix}play ${info.title}_`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude reconocer la canción.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["whatmusic", "quecancion", "shazam"];
export default handler;
