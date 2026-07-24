// plugins/pluginsgrupos/Linkall.js — Bloquear cualquier enlace en el grupo
import { getConfig, setConfig } from "../../db.js";
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const estado = String(args[0] || "").toLowerCase();
  const actual = global.estaActivo(getConfig(chatId, "linkall")) ? "on" : "off";

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "🚷 *Bloqueo de enlaces (linkall)*\n\n" +
        "Borra *cualquier* enlace que se envíe al grupo (webs, YouTube, TikTok...).\n" +
        "A la tercera advertencia, el usuario es expulsado.\n" +
        "Los administradores y el dueño del bot están exentos.\n\n" +
        `Estado actual: *${actual === "on" ? "activado ✅" : "desactivado ❌"}*\n\n` +
        `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*`
    }, { quoted: msg });
  }

  setConfig(chatId, "linkall", estado === "on" ? 1 : 0);

  if (estado === "on" && !(await conn.botPuede(chatId, "can_delete_messages"))) {
    await conn.sendMessage(chatId, {
      text: "⚠️ Lo activé, pero *necesito ser admin con permiso para borrar mensajes* para que funcione."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🚷 *Bloqueo de enlaces* ${estado === "on" ? "activado ✅" : "desactivado ❌"} en este grupo.`
  }, { quoted: msg });
};

handler.command = ["linkall"];
export default handler;
