// plugins/pluginsowner/Apagado.js — Apagar/prender el bot en un grupo
import { getConfig, setConfig } from "../../db.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ *Solo el dueño del bot puede apagarlo o prenderlo.*"
    }, { quoted: msg });
  }

  const estado = String(args[0] || "").toLowerCase();
  const apagado = global.estaActivo(getConfig(chatId, "apagado"));

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "🛑 *Apagar el bot en este chat*\n\n" +
        `Estado actual: *${apagado ? "apagado 🛑" : "encendido ✅"}*\n\n` +
        `• *${usedPrefix}${command} on* → apagar aquí\n` +
        `• *${usedPrefix}${command} off* → volver a encender\n\n` +
        "_Mientras esté apagado solo el dueño puede usar comandos aquí._"
    }, { quoted: msg });
  }

  setConfig(chatId, "apagado", estado === "on" ? 1 : 0);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: estado === "on"
      ? "🛑 *Bot apagado en este chat.* Solo el dueño puede usarme aquí."
      : "✅ *Bot encendido de nuevo.* ¡Ya pueden usar mis comandos!"
  }, { quoted: msg });
};

handler.command = ["apagado", "apagar"];
export default handler;
