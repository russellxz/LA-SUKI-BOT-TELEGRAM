// plugins/Mixemoji.js — Mezclar dos emojis en un sticker
import axios from "axios";
import { imageToWebp } from "../libs/fuctions.js";

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const emojis = String(args.join(" ") || "").trim().split(/\s+/).filter(Boolean);

  if (emojis.length < 2) {
    return conn.sendMessage(chatId, {
      text:
        `🎭 *Mezclar dos emojis*\n\n` +
        `Usa: *${usedPrefix}${command} 😎 🥶*\n\n` +
        "_Te devuelvo un sticker con la mezcla._"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const { data } = await axios.get(
      `https://api.neoxr.eu/api/emoji?q=${encodeURIComponent(`${emojis[0]}_${emojis[1]}`)}&apikey=russellxz`,
      { timeout: 60000 }
    );

    const url = data?.data?.url || data?.url || data?.data?.[0]?.url;
    if (!url) throw new Error("Esa combinación de emojis no existe");

    const { data: binario } = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
    const sticker = await imageToWebp(Buffer.from(binario));

    await conn.sendMessage(chatId, { sticker, fileName: "mix.webp" }, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude mezclarlos.\n\n_${String(e.message).slice(0, 200)}_\n\n_Prueba con otros emojis: no todas las combinaciones existen._`
    }, { quoted: msg });
  }
};

handler.command = ["mixemoji", "mezclaemoji"];
export default handler;
