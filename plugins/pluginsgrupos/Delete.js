// plugins/pluginsgrupos/Delete.js — Borrar el mensaje al que se responde
import { noEsAdmin } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (!msg.quoted) {
    return conn.sendMessage(chatId, {
      text: `❓ *Responde al mensaje que quieres eliminar* usando *${usedPrefix}${command}*.`
    }, { quoted: msg });
  }

  const esMio = String(msg.quoted.senderId) === String(conn.user.id);

  // Para borrar mensajes de otros hace falta ser admin del grupo
  if (msg.isGroup && !esMio) {
    if (await noEsAdmin(msg, ctx, "⛔ *Solo administradores o dueños del bot pueden borrar mensajes ajenos.*")) return;
    if (!(await conn.botPuede(chatId, "can_delete_messages"))) {
      return conn.sendMessage(chatId, {
        text: "⚠️ *No soy administrador aquí*, así que solo puedo borrar mis propios mensajes."
      }, { quoted: msg });
    }
  }

  const borrado = await conn.deleteMessage(chatId, msg.quoted.messageId);
  if (!borrado) {
    return conn.sendMessage(chatId, {
      text: "❌ No pude borrar ese mensaje.\n\n_Telegram no deja borrar mensajes de más de 48 horas._"
    }, { quoted: msg });
  }

  // El comando también se borra para no dejar rastro
  await conn.deleteMessage(chatId, msg.message_id);
};

handler.command = ["delete", "borrar", "eliminar"];
export default handler;
