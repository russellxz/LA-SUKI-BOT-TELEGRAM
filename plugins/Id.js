// plugins/Id.js — Ver los IDs de Telegram (tuyo, del chat y del citado)
//
// Reemplaza a los viejos comandos de LID de WhatsApp: en Telegram lo que
// identifica a cada quien es un número de ID.
const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;

  let texto =
    "🆔 *IDENTIFICADORES*\n\n" +
    `👤 *Tú:* \`${msg.senderId}\`\n` +
    `📛 Nombre: ${msg.senderName}\n` +
    (msg.senderUser ? `🔗 Usuario: @${msg.senderUser}\n` : "") +
    `\n💬 *Este chat:* \`${chatId}\`\n` +
    `📍 Tipo: ${msg.isGroup ? "grupo" : "privado"}\n` +
    (msg.isGroup ? `🏷️ Nombre: ${msg.chatName}\n` : "");

  if (msg.quoted?.senderId) {
    texto +=
      `\n↩️ *Del mensaje citado:*\n` +
      `👤 ID: \`${msg.quoted.senderId}\`\n` +
      `📛 Nombre: ${msg.quoted.senderName}\n` +
      (msg.quoted.senderUser ? `🔗 Usuario: @${msg.quoted.senderUser}\n` : "");
  }

  if (msg.quoted?.media?.uniqueId) {
    texto += `\n📎 *Archivo citado:*\n🆔 \`${msg.quoted.media.uniqueId}\`\n📦 Tipo: ${msg.quoted.media.tipo}\n`;
  }

  texto += `\n_Con el ID puedes usar comandos como ${usedPrefix}kick 123456789_`;

  await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["id", "myid", "miid", "chatid"];
export default handler;
