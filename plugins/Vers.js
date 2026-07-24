// plugins/Vers.js — Ver los paquetes de stickers guardados
import fs from "fs";
import path from "path";

const PACKS_DB = path.resolve("./guars_packs.json");

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "📂");

  let db = {};
  try {
    if (fs.existsSync(PACKS_DB)) db = JSON.parse(fs.readFileSync(PACKS_DB, "utf-8") || "{}");
  } catch {}

  const nombres = Object.keys(db).filter((k) => Array.isArray(db[k]) && db[k].length);
  if (!nombres.length) {
    return conn.sendMessage(chatId, {
      text: `📂 *No hay paquetes de stickers todavía.*\n\n_Crea uno respondiendo a un sticker con ${usedPrefix}guarsk <nombre>_`
    }, { quoted: msg });
  }

  const lineas = nombres.sort().map((n) => {
    const animados = db[n].filter((s) => s.animado).length;
    return `│ 🌟 *${n}* — ${db[n].length} sticker(s)${animados ? ` (${animados} animados)` : ""}`;
  });

  await conn.sendMessage(chatId, {
    text:
      `╭──『 🌟 *PAQUETES DE STICKERS* 』\n│\n${lineas.join("\n")}\n│\n╰────────────────◆\n\n` +
      `_Enviar uno: ${usedPrefix}sendsk <nombre>_\n` +
      `_Borrar uno: ${usedPrefix}delsk <nombre> <número>_`
  }, { quoted: msg });
};

handler.command = ["versk", "verpacks2", "verstickers"];
export default handler;
