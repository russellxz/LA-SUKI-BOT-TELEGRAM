// plugins/pluginsowner/Delco.js — Quitarle el comando a un sticker
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./comandos.json");

const handler = async (msg, ctx) => {
  const { conn, usedPrefix, command, isOwner, isAdmin } = ctx;
  const chatId = msg.chatId;

  if (!isOwner && !isAdmin) {
    return conn.sendMessage(chatId, {
      text: "🚫 *Solo los administradores o el dueño del bot pueden usar este comando.*"
    }, { quoted: msg });
  }

  const sticker = msg.quoted?.media?.tipo === "sticker" ? msg.quoted.media : null;
  if (!sticker) {
    return conn.sendMessage(chatId, {
      text: `❌ *Responde al sticker* que quieres desenlazar con *${usedPrefix}${command}*.`
    }, { quoted: msg });
  }

  let mapa = {};
  try {
    if (fs.existsSync(ARCHIVO)) mapa = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8") || "{}");
  } catch {}

  if (!mapa[sticker.uniqueId]) {
    return conn.sendMessage(chatId, { text: "⚠️ Ese sticker no tiene ningún comando asignado." }, { quoted: msg });
  }

  const anterior = mapa[sticker.uniqueId];
  delete mapa[sticker.uniqueId];
  fs.writeFileSync(ARCHIVO, JSON.stringify(mapa, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🗑️ *Listo.* Ese sticker ya no ejecuta \`${anterior}\`.`
  }, { quoted: msg });
};

handler.command = ["delco", "delcomando"];
export default handler;
