// plugins/pluginsgrupos/Antilink.js — Bloquear invitaciones a otros grupos/canales
import { getConfig, setConfig } from "../../db.js";
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const estado = String(args[0] || "").toLowerCase();
  const actual = global.estaActivo(getConfig(chatId, "antilink")) ? "on" : "off";

  if (!["on", "off"].includes(estado)) {
    return conn.sendMessage(chatId, {
      text:
        "🔗 *Antilink*\n\n" +
        "Borra los enlaces de invitación a otros grupos o canales de Telegram (t.me/...).\n" +
        "A la tercera advertencia, el usuario es expulsado.\n" +
        "Los administradores y el dueño del bot están exentos.\n\n" +
        `Estado actual: *${actual === "on" ? "activado ✅" : "desactivado ❌"}*\n\n` +
        `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*\n` +
        `_Para bloquear TODOS los enlaces usa ${usedPrefix}linkall_`
    }, { quoted: msg });
  }

  setConfig(chatId, "antilink", estado === "on" ? 1 : 0);

  if (estado === "on" && !(await conn.botPuede(chatId, "can_delete_messages"))) {
    await conn.sendMessage(chatId, {
      text: "⚠️ Activé el antilink, pero *necesito ser admin con permiso para borrar mensajes* para que funcione."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🔗 *Antilink* ${estado === "on" ? "activado ✅" : "desactivado ❌"} en este grupo.`
  }, { quoted: msg });
};

handler.command = ["antilink"];
export default handler;
