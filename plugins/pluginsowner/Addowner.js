// plugins/pluginsowner/Addowner.js — Agregar un dueño al bot
import { objetivoDe, comoIndicarUsuario, mencion } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ *Solo un dueño del bot puede agregar a otro dueño.*"
    }, { quoted: msg });
  }

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, { text: comoIndicarUsuario(usedPrefix, command) }, { quoted: msg });
  }

  if (global.isOwner(objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} ya es dueño del bot.`
    }, { quoted: msg });
  }

  global.owner.push([String(objetivo.id), objetivo.nombre || "Owner"]);
  global.guardarOwners();

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `👑 ${mencion(objetivo.id, objetivo.nombre)} *ahora es dueño del bot.*\n\n` +
      `Tiene acceso a todos los comandos, incluido *${usedPrefix}menuowner*.`
  }, { quoted: msg });
};

handler.command = ["addowner", "adddueno"];
export default handler;
