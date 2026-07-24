// plugins/pluginsowner/Unre.js — Liberar un comando restringido
import { quitarDeLista, listaChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo el *dueño del bot* puede liberar comandos."
    }, { quoted: msg });
  }

  const objetivo = String(args[0] || "").toLowerCase().replace(/^[./#]/, "");
  const actuales = listaChat(chatId, "restringidos");

  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text:
        `⚠️ Usa: *${usedPrefix}${command} <comando>*\n\n` +
        (actuales.length
          ? `*Restringidos ahora:*\n${actuales.map((c) => `• ${c}`).join("\n")}`
          : "_No hay comandos restringidos en este chat._")
    }, { quoted: msg });
  }

  if (!quitarDeLista(chatId, "restringidos", objetivo)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ El comando *${objetivo}* no estaba restringido aquí.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🔓 El comando *${objetivo}* ya está libre en este chat.`
  }, { quoted: msg });
};

handler.command = ["unre", "liberar"];
export default handler;
