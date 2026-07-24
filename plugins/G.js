// plugins/G.js — Enviar un archivo concreto de un paquete guardado
import fs from "fs";
import path from "path";

const FILES_DB = path.resolve("./guar_files.json");

const CAMPO = {
  imagen: "image", video: "video", audio: "audio", nota: "audio",
  sticker: "sticker", documento: "document", gif: "video"
};

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "📦");

  const numero = parseInt(args[args.length - 1]);
  const paquete = (Number.isNaN(numero) ? args.join(" ") : args.slice(0, -1).join(" ")).trim().toLowerCase();

  let db = {};
  try {
    if (fs.existsSync(FILES_DB)) db = JSON.parse(fs.readFileSync(FILES_DB, "utf-8") || "{}");
  } catch {}

  if (!paquete) {
    return conn.sendMessage(chatId, {
      text:
        `❗ Usa: *${usedPrefix}${command} <palabra> <número>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} memes 2\n\n` +
        `_Sin número te mando TODO el paquete._`
    }, { quoted: msg });
  }

  const items = db[paquete];
  if (!Array.isArray(items) || !items.length) {
    return conn.sendMessage(chatId, {
      text: `❌ No hay ningún paquete llamado *"${paquete}"*.\n\n_Míralos con ${usedPrefix}menuaudio_`
    }, { quoted: msg });
  }

  const enviar = async (item) => {
    const paquete = {};
    if (item.fileId) {
      paquete[CAMPO[item.tipo] || "document"] = item.fileId;
    } else if (item.path && fs.existsSync(path.resolve(item.path))) {
      paquete[CAMPO[item.tipo] || "document"] = fs.readFileSync(path.resolve(item.path));
      if (item.fileName) paquete.fileName = item.fileName;
    } else if (item.texto) {
      paquete.text = item.texto;
    } else {
      return false;
    }
    if (item.tipo === "nota") paquete.ptt = true;
    if (item.caption && !paquete.sticker && !paquete.text) paquete.caption = item.caption;
    await conn.sendMessage(chatId, paquete, { quoted: msg });
    return true;
  };

  if (Number.isNaN(numero)) {
    for (const item of items.slice(0, 20)) {
      await enviar(item).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
    }
    return;
  }

  if (numero < 1 || numero > items.length) {
    return conn.sendMessage(chatId, {
      text: `❌ El paquete *"${paquete}"* tiene *${items.length}* archivo(s). Elige un número del 1 al ${items.length}.`
    }, { quoted: msg });
  }

  const ok = await enviar(items[numero - 1]);
  if (!ok) {
    await conn.sendMessage(chatId, { text: "❌ Ese archivo ya no está disponible." }, { quoted: msg });
  }
};

handler.command = ["g", "enviar"];
export default handler;
