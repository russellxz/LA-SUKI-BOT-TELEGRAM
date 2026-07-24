// plugins/Kiss.js — besó a alguien del grupo (con ranking)
import fs from "fs";
import path from "path";
import { noEsGrupo, objetivoDe, mencion } from "../libs/grupo.js";

const DB = path.resolve("kiss_data.json");

function leer() {
  try {
    if (fs.existsSync(DB)) return JSON.parse(fs.readFileSync(DB, "utf-8") || "{}");
  } catch {}
  return {};
}

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  await conn.react(chatId, msg.message_id, "😘");

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text: `😘 *¿A quién?*\n\nResponde a un mensaje suyo o menciónalo:\n*${usedPrefix}${command} @usuario*`
    }, { quoted: msg });
  }

  if (String(objetivo.id) === String(msg.senderId)) {
    return conn.sendMessage(chatId, { text: "😅 No puedes hacerte eso a ti mismo." }, { quoted: msg });
  }

  const db = leer();
  const grupo = String(chatId);
  db[grupo] = db[grupo] || {};
  db[grupo][objetivo.id] = (db[grupo][objetivo.id] || 0) + 1;
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));

  await conn.sendMessage(chatId, {
    text:
      `😘 ${mencion(msg.senderId, msg.senderName)} besó a ${mencion(objetivo.id, objetivo.nombre)}\n\n` +
      `📊 Lleva *${db[grupo][objetivo.id]}* besos en este grupo.`,
    mentions: [msg.senderId, objetivo.id]
  }, { quoted: msg });
};

handler.command = ["kiss", "besar"];
export default handler;
