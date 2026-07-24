// plugins/pluginsowner/Modoprivado.js — Modo privado global (solo dueños)
import { getConfig, setConfig } from "../../db.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ *Solo el dueño del bot puede cambiar el modo privado.*"
    }, { quoted: msg });
  }

  const estado = String(args[0] || "").toLowerCase();
  const activo = global.estaActivo(getConfig("global", "modoprivado"));

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "🔒 *Modo privado global*\n\n" +
        `Estado actual: *${activo ? "activado 🔒" : "desactivado 🔓"}*\n\n` +
        `• *${usedPrefix}${command} on* → solo los dueños pueden usar el bot\n` +
        `• *${usedPrefix}${command} off* → todos pueden usarlo\n\n` +
        "_Afecta a TODOS los chats y grupos._"
    }, { quoted: msg });
  }

  setConfig("global", "modoprivado", estado === "on" ? 1 : 0);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: estado === "on"
      ? "🔒 *Modo privado activado.* Ahora solo los dueños pueden usarme."
      : "🔓 *Modo privado desactivado.* Ya todos pueden usarme."
  }, { quoted: msg });
};

handler.command = ["modoprivado", "privado"];
export default handler;
