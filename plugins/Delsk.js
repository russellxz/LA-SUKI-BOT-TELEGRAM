// plugins/Delsk.js — Borrar un sticker de un paquete
import fs from "fs";
import path from "path";

const PACKS_DB = path.resolve("./guars_packs.json");

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;

  let db = {};
  try {
    if (fs.existsSync(PACKS_DB)) db = JSON.parse(fs.readFileSync(PACKS_DB, "utf-8") || "{}");
  } catch {}

  const numero = parseInt(args[args.length - 1]);
  const nombre = (Number.isNaN(numero) ? args.join(" ") : args.slice(0, -1).join(" ")).trim().toLowerCase();

  if (!nombre) {
    const nombres = Object.keys(db).filter((k) => db[k]?.length);
    return conn.sendMessage(chatId, {
      text:
        `❗ Usa: *${usedPrefix}${command} <paquete> <número>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} memes 2\n\n` +
        (nombres.length ? `*Paquetes:*\n${nombres.map((n) => `• ${n} (${db[n].length})`).join("\n")}` : "")
    }, { quoted: msg });
  }

  const stickers = db[nombre];
  if (!Array.isArray(stickers) || !stickers.length) {
    return conn.sendMessage(chatId, { text: `❌ No existe el paquete *"${nombre}"*.` }, { quoted: msg });
  }

  // Sin número: borra el paquete entero
  if (Number.isNaN(numero)) {
    const cuantos = stickers.length;
    delete db[nombre];
    fs.writeFileSync(PACKS_DB, JSON.stringify(db, null, 2));
    await conn.react(chatId, msg.message_id, "✅");
    return conn.sendMessage(chatId, {
      text: `🗑️ Borré el paquete *"${nombre}"* completo (${cuantos} stickers).`
    }, { quoted: msg });
  }

  if (numero < 1 || numero > stickers.length) {
    return conn.sendMessage(chatId, {
      text: `⚠️ Ese paquete tiene *${stickers.length}* sticker(s). Elige un número del 1 al ${stickers.length}.`
    }, { quoted: msg });
  }

  stickers.splice(numero - 1, 1);
  if (!stickers.length) delete db[nombre];
  fs.writeFileSync(PACKS_DB, JSON.stringify(db, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🗑️ Borré el sticker *#${numero}* de *"${nombre}"*.` +
      (db[nombre] ? `\nQuedan *${db[nombre].length}*.` : "\n_El paquete quedó vacío._")
  }, { quoted: msg });
};

handler.command = ["delsk", "borrarsticker"];
export default handler;
