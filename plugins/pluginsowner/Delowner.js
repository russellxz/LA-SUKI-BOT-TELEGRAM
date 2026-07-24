// plugins/pluginsowner/Delowner.js — Quitar a un dueño del bot
import { objetivoDe, comoIndicarUsuario, mencion } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner, senderId } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ *Solo un dueño del bot puede quitar a otro dueño.*"
    }, { quoted: msg });
  }

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    const lista = global.owner
      .map((o, i) => `${i + 1}. ${mencion(Array.isArray(o) ? o[0] : o)}`)
      .join("\n");
    return conn.sendMessage(chatId, {
      text: comoIndicarUsuario(usedPrefix, command) + `\n\n*Dueños actuales:*\n${lista}`
    }, { quoted: msg });
  }

  if (!global.isOwner(objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} no es dueño del bot.`
    }, { quoted: msg });
  }

  if (global.owner.length <= 1) {
    return conn.sendMessage(chatId, {
      text: "⚠️ No puedo quitar al *único* dueño del bot. Agrega otro primero."
    }, { quoted: msg });
  }

  global.owner = global.owner.filter(
    (o) => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, "") !== String(objetivo.id)
  );
  global.guardarOwners();

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `📉 ${mencion(objetivo.id, objetivo.nombre)} ya no es dueño del bot.`
  }, { quoted: msg });
};

handler.command = ["delowner", "deldueno"];
export default handler;
