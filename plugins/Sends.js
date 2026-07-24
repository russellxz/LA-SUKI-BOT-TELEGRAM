// plugins/Sends.js — Enviar un paquete de stickers guardado
import fs from "fs";
import path from "path";

const PACKS_DB = path.resolve("./guars_packs.json");

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;

  let db = {};
  try {
    if (fs.existsSync(PACKS_DB)) db = JSON.parse(fs.readFileSync(PACKS_DB, "utf-8") || "{}");
  } catch {}

  const nombre = String(text || "").trim().toLowerCase();
  const nombres = Object.keys(db).filter((k) => Array.isArray(db[k]) && db[k].length);

  if (!nombre) {
    return conn.sendMessage(chatId, {
      text:
        `❗ Usa: *${usedPrefix}${command} <nombre del paquete>*\n\n` +
        (nombres.length ? `*Paquetes:*\n${nombres.map((n) => `• ${n}`).join("\n")}` : `_No hay paquetes guardados. Crea uno con ${usedPrefix}guarsk_`)
    }, { quoted: msg });
  }

  const stickers = db[nombre];
  if (!Array.isArray(stickers) || !stickers.length) {
    return conn.sendMessage(chatId, {
      text: `❌ No existe el paquete *"${nombre}"*.\n\n_Míralos con ${usedPrefix}versk_`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendMessage(chatId, {
    text: `🌟 *Paquete "${nombre}"* — enviando ${stickers.length} sticker(s)...`
  }, { quoted: msg });

  let enviados = 0;
  for (const s of stickers) {
    try {
      await conn.sendMessage(chatId, { sticker: s.fileId });
      enviados++;
    } catch {}
    await new Promise((r) => setTimeout(r, 350));
  }

  await conn.react(chatId, msg.message_id, "✅");
  if (enviados < stickers.length) {
    await conn.sendMessage(chatId, {
      text: `⚠️ Envié *${enviados}* de *${stickers.length}*. Algunos ya no están disponibles.`
    }, { quoted: msg });
  }
};

handler.command = ["sendsk", "sends", "enviarpack"];
export default handler;
