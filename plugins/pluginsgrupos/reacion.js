// plugins/pluginsgrupos/reacion.js — Respuestas automáticas
import { getConfig, setConfig } from "../../db.js";
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const estado = String(args[0] || "").toLowerCase();
  const actual = global.estaActivo(getConfig(chatId, "reacion")) ? "on" : "off";

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "💬 *Respuestas automáticas*\n\n" +
        "Responde con el multimedia guardado cuando alguien escribe una palabra clave (comando guar).\n\n" +
        `Estado actual: *${actual === "on" ? "activado ✅" : "desactivado ❌"}*\n\n` +
        `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*`
    }, { quoted: msg });
  }

  setConfig(chatId, "reacion", estado === "on" ? 1 : 0);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `💬 *Respuestas automáticas* ${estado === "on" ? "activado ✅" : "desactivado ❌"} en este grupo.`
  }, { quoted: msg });
};

handler.command = ["reacion", "reaccion"];
export default handler;
