// plugins/Guarsk.js — Guardar stickers en paquetes
import fs from "fs";
import path from "path";

const PACKS_DB = path.resolve("./guars_packs.json");

export function leerPacks() {
  try {
    if (fs.existsSync(PACKS_DB)) return JSON.parse(fs.readFileSync(PACKS_DB, "utf-8") || "{}");
  } catch {}
  return {};
}

export function guardarPacks(db) {
  fs.writeFileSync(PACKS_DB, JSON.stringify(db, null, 2));
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;

  const media = msg.media?.tipo === "sticker" ? msg.media : msg.quoted?.media;
  if (!media || media.tipo !== "sticker") {
    return conn.sendMessage(chatId, {
      text:
        "🌟 *Guardar stickers en un paquete*\n\n" +
        `Responde a un sticker con *${usedPrefix}${command} <nombre del paquete>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} memes\n\n` +
        `_Ver los paquetes: ${usedPrefix}versk_\n_Enviarlos: ${usedPrefix}sendsk memes_`
    }, { quoted: msg });
  }

  const nombre = String(text || "").trim().toLowerCase();
  if (!nombre) {
    return conn.sendMessage(chatId, {
      text: `❌ Ponle nombre al paquete.\n\n*Ejemplo:* ${usedPrefix}${command} memes`
    }, { quoted: msg });
  }

  const db = leerPacks();
  if (!Array.isArray(db[nombre])) db[nombre] = [];

  if (db[nombre].some((s) => s.uniqueId === media.uniqueId)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ Ese sticker ya está en el paquete *"${nombre}"*.`
    }, { quoted: msg });
  }

  db[nombre].push({
    fileId: media.fileId,
    uniqueId: media.uniqueId,
    animado: !!media.animado,
    emoji: media.emoji || null,
    user: msg.senderId,
    creado: Date.now()
  });
  guardarPacks(db);

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `✅ *Sticker guardado en "${nombre}".*\n\n` +
      `🔢 El paquete tiene *${db[nombre].length}* sticker(s).\n\n` +
      `_Envíalos todos con ${usedPrefix}sendsk ${nombre}_`
  }, { quoted: msg });
};

handler.command = ["guarsk", "guardarsticker"];
export default handler;
