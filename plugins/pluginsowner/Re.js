// plugins/pluginsowner/Re.js — Restringir un comando en este chat
import { agregarALista, listaChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo el *dueño del bot* puede restringir comandos."
    }, { quoted: msg });
  }

  const objetivo = String(args[0] || "").toLowerCase().replace(/^[./#]/, "");
  if (!objetivo) {
    const actuales = listaChat(chatId, "restringidos");
    return conn.sendMessage(chatId, {
      text:
        `⚠️ Usa: *${usedPrefix}${command} <comando>* para restringirlo aquí.\n\n` +
        (actuales.length
          ? `*Restringidos ahora:*\n${actuales.map((c) => `• ${c}`).join("\n")}`
          : "_Ahora mismo no hay comandos restringidos en este chat._")
    }, { quoted: msg });
  }

  if (!agregarALista(chatId, "restringidos", objetivo)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ El comando *${objetivo}* ya estaba restringido aquí.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `🔒 El comando *${objetivo}* quedó *restringido* en este chat.\n\n` +
      `Solo los admins y el dueño podrán usarlo.\n_Para liberarlo: ${usedPrefix}unre ${objetivo}_`
  }, { quoted: msg });
};

handler.command = ["re", "restringir"];
export default handler;
