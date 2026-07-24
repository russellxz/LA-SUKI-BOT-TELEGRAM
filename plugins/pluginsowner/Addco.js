// plugins/pluginsowner/Addco.js — Asignar un comando a un sticker
//
// Responde a un sticker con: .addco menu
// A partir de ahí, cuando alguien mande ese sticker, el bot ejecuta el comando.
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./comandos.json");

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command, isOwner, isAdmin } = ctx;
  const chatId = msg.chatId;

  if (!isOwner && !isAdmin) {
    return conn.sendMessage(chatId, {
      text: msg.isGroup
        ? "🚫 *Solo los administradores o el dueño del bot pueden usar este comando.*"
        : "🚫 *Solo el dueño del bot puede usar este comando en privado.*"
    }, { quoted: msg });
  }

  const sticker = msg.quoted?.media?.tipo === "sticker" ? msg.quoted.media : null;
  if (!sticker) {
    return conn.sendMessage(chatId, {
      text:
        "❌ *Responde a un sticker* para asignarle un comando.\n\n" +
        `*Ejemplo:* responde al sticker con *${usedPrefix}${command} menu*`
    }, { quoted: msg });
  }

  const comando = (text || "").trim();
  if (!comando) {
    return conn.sendMessage(chatId, {
      text: `❌ Escribe qué comando quieres asignarle.\n\n*Ejemplo:* ${usedPrefix}${command} play bad bunny`
    }, { quoted: msg });
  }

  let mapa = {};
  try {
    if (fs.existsSync(ARCHIVO)) mapa = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8") || "{}");
  } catch {}

  const yaTenia = mapa[sticker.uniqueId];
  mapa[sticker.uniqueId] = comando;
  fs.writeFileSync(ARCHIVO, JSON.stringify(mapa, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `✅ *Sticker enlazado al comando* \`${comando}\`\n\n` +
      (yaTenia ? `_Antes ejecutaba:_ \`${yaTenia}\`\n\n` : "") +
      "Ahora, cuando alguien envíe ese sticker, ejecuto ese comando automáticamente.\n" +
      `_Para quitarlo: responde al sticker con ${usedPrefix}delco_`
  }, { quoted: msg });
};

handler.command = ["addco", "addcomando"];
export default handler;
