// plugins/Tourl.js — Subir un archivo a internet y devolver el enlace
import fs from "fs";
import path from "path";
import quAx from "../libs/upload.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);

  if (!media) {
    return conn.sendMessage(chatId, {
      text:
        `🔗 *Subir archivo a internet*\n\n` +
        `Responde a una foto, video, audio, sticker o documento con *${usedPrefix}${command}*\n` +
        "y te devuelvo un enlace directo."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  const temporal = path.resolve(`./tmp/tourl_${Date.now()}.${media.ext || "bin"}`);

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    fs.mkdirSync(path.dirname(temporal), { recursive: true });
    fs.writeFileSync(temporal, buffer);

    const respuesta = await quAx(temporal);
    if (!respuesta.status) throw new Error(respuesta.message || "El servidor rechazó el archivo");

    await conn.sendMessage(chatId, {
      text:
        `🔗 *Archivo subido*\n\n` +
        `📎 ${respuesta.result.url}\n\n` +
        `📦 Tipo: ${media.tipo}\n` +
        `📏 Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`
    }, { quoted: msg, preview: true });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude subir el archivo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  } finally {
    try {
      if (fs.existsSync(temporal)) fs.unlinkSync(temporal);
    } catch {}
  }
};

handler.command = ["tourl", "tourl2", "tourl3", "subir", "url"];
export default handler;
