// plugins/Tts.js — Convertir texto en nota de voz
import axios from "axios";
import googleTTS from "google-tts-api";
import { toPTT, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let contenido = (text || msg.quoted?.text || "").trim();

  if (!contenido) {
    return conn.sendMessage(chatId, {
      text:
        `🗣️ *Texto a voz*\n\n` +
        `Usa: *${usedPrefix}${command} <texto>*\n` +
        "O responde a un mensaje con el comando.\n\n" +
        `*Ejemplo:* ${usedPrefix}${command} hola a todos`
    }, { quoted: msg });
  }

  if (contenido.length > 200) contenido = contenido.slice(0, 200);

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendPresenceUpdate("recording", chatId);

  try {
    const url = googleTTS.getAudioUrl(contenido, { lang: "es", slow: false, host: "https://translate.google.com" });

    const respuesta = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://translate.google.com/"
      }
    });

    const mp3 = Buffer.from(respuesta.data);

    // Telegram acepta MP3 como audio; para nota de voz hace falta OGG/Opus
    if (hayFfmpeg()) {
      try {
        const ogg = await toPTT(mp3, "mp3");
        await conn.sendMessage(chatId, { audio: ogg, ptt: true, fileName: "voz.ogg" }, { quoted: msg });
        return conn.react(chatId, msg.message_id, "✅");
      } catch {}
    }

    await conn.sendMessage(chatId, {
      audio: mp3,
      fileName: "voz.mp3",
      title: contenido.slice(0, 40),
      performer: "La Suki Bot"
    }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude generar el audio.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tts", "voz", "decir"];
export default handler;
