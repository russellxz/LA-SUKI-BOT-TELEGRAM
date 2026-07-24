// plugins/Chat.js — Activar/desactivar la IA que responde sola en el grupo
import { getConfig, setConfig, deleteConfig } from "../db.js";
import { noEsGrupo, noEsAdmin } from "../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "🚫 Solo los administradores u owners pueden usar este comando.")) return;

  const estado = String(args[0] || "").toLowerCase();
  const activo = global.estaActivo(getConfig(chatId, "chatgpt"));

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "🤖 *IA conversacional del grupo*\n\n" +
        "Cuando está activa, respondo sola a los mensajes normales del grupo.\n\n" +
        `Estado actual: *${activo ? "activada ✅" : "desactivada ❌"}*\n\n` +
        `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*`
    }, { quoted: msg });
  }

  if (estado === "on") setConfig(chatId, "chatgpt", 1);
  else deleteConfig(chatId, "chatgpt");

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🤖 *IA del grupo ${estado === "on" ? "activada ✅" : "desactivada ❌"}*` +
      (estado === "on" ? "\n\n_Responderé a los mensajes normales del grupo._" : "")
  }, { quoted: msg });
};

handler.command = ["chat", "chatia"];
export default handler;
