// plugins/pluginsowner/Delmenu.js — Volver a el menú principal original
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./setmenu.json");

const handler = async (msg, ctx) => {
  const { conn, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Solo el dueño del bot puede usar este comando.*" }, { quoted: msg });
  }

  let data = {};
  try {
    if (fs.existsSync(ARCHIVO)) data = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8") || "{}");
  } catch {}

  if (!data.menu) {
    return conn.sendMessage(chatId, { text: "ℹ️ Ese menú no está personalizado, ya usa el original." }, { quoted: msg });
  }

  delete data.menu;
  fs.writeFileSync(ARCHIVO, JSON.stringify(data, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, { text: "🗑️ *Listo.* Volví a el menú principal original." }, { quoted: msg });
};

handler.command = ["delmenu"];
export default handler;
