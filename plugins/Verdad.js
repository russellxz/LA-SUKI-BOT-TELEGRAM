// plugins/Verdad.js — Pregunta de "verdad" al azar
const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "🤔");

  const lista = Array.isArray(global.verdad) ? global.verdad : [];
  if (!lista.length) {
    return conn.sendMessage(chatId, { text: "❌ No tengo preguntas cargadas." }, { quoted: msg });
  }

  const pregunta = lista[Math.floor(Math.random() * lista.length)].trim();
  await conn.sendMessage(chatId, {
    text: `🎯 *VERDAD*\n\n${pregunta}\n\n👤 Para: *${msg.senderName}*`
  }, { quoted: msg });
};

handler.command = ["verdad", "truth"];
export default handler;
