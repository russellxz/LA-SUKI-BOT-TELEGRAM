// plugins/Perfil.js — Ver la foto de perfil de alguien
import { objetivoDe } from "../libs/grupo.js";

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "👀");

  const objetivo = objetivoDe(msg, args) || { id: msg.senderId, nombre: msg.senderName };

  const foto = await conn.profilePictureUrl(objetivo.id);
  if (!foto) {
    return conn.sendMessage(chatId, {
      text:
        `😕 *${objetivo.nombre}* no tiene foto de perfil o la tiene oculta.\n\n` +
        `_Uso: responde a alguien con ${usedPrefix}${command}, o menciónalo._`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    image: foto,
    caption: `📸 *Foto de perfil*\n👤 ${objetivo.nombre}\n🆔 \`${objetivo.id}\``
  }, { quoted: msg });
};

handler.command = ["perfil", "pfp", "foto"];
export default handler;
