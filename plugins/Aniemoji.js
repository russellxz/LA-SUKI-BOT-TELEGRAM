// plugins/Aniemoji.js — Convertir un emoji en sticker animado
import axios from "axios";
import { videoToWebm, hayFfmpeg } from "../libs/fuctions.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const emoji = String(text || "").trim();

  if (!emoji || !/\p{Emoji}/u.test(emoji)) {
    return conn.sendMessage(chatId, {
      text: `😎 *Envía un emoji para convertirlo en sticker animado.*\n\n*Ejemplo:* ${usedPrefix}${command} 😎`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const { data } = await axios.get(
      `https://api.neoxr.eu/api/emojito?q=${encodeURIComponent(emoji)}&apikey=russellxz`,
      { timeout: 60000 }
    );

    const url = data?.data?.url || data?.url;
    if (!url) throw new Error("La API no devolvió ninguna animación");

    // Se descarga y se convierte al formato de sticker animado de Telegram
    const { data: binario } = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
    let sticker = Buffer.from(binario);
    let nombre = "sticker.webp";

    if (hayFfmpeg()) {
      try {
        sticker = await videoToWebm(sticker, url.includes(".gif") ? "gif" : "webp");
        nombre = "sticker.webm";
      } catch {}
    }

    await conn.sendMessage(chatId, { sticker, fileName: nombre }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude animar ese emoji.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["aniemoji", "emojianimado"];
export default handler;
