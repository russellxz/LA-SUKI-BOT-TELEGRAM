// plugins/Hd.js — Mejorar la calidad de una imagen
import axios from "axios";
import { subirArchivo } from "../libs/subir.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo === "imagen" ? msg.media : null);

  if (!media || !["imagen", "sticker"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text: `✨ *Responde a una imagen* con *${usedPrefix}${command}* para mejorarle la calidad.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    const url = await subirArchivo(buffer, "imagen.jpg");

    const { data } = await axios.get(
      `https://api.neoxr.eu/api/remini?image=${encodeURIComponent(url)}&apikey=russellxz`,
      { timeout: 120000 }
    );

    const resultado = data?.data?.url || data?.url;
    if (!resultado) throw new Error("La API no devolvió ninguna imagen");

    await conn.sendMessage(chatId, {
      image: { url: resultado },
      caption: "✨ *Imagen mejorada*\n\n🤖 _La Suki Bot_"
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude mejorar la imagen.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["hd", "remini", "mejorar"];
export default handler;
