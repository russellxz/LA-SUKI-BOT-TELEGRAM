// plugins/pluginsgrupos/Welcome.js — Bienvenidas
import { getConfig, setConfig } from "../../db.js";
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const estado = String(args[0] || "").toLowerCase();
  const actual = global.estaActivo(getConfig(chatId, "welcome")) ? "on" : "off";

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "👋 *Bienvenidas*\n\n" +
        "Saluda automáticamente a quien entra al grupo.\n\n" +
        `Estado actual: *${actual === "on" ? "activado ✅" : "desactivado ❌"}*\n\n` +
        `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*`
    }, { quoted: msg });
  }

  setConfig(chatId, "welcome", estado === "on" ? 1 : 0);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `👋 *Bienvenidas* ${estado === "on" ? "activado ✅" : "desactivado ❌"} en este grupo.`
  }, { quoted: msg });
};

handler.command = ["welcome", "bienvenida"];
export default handler;
