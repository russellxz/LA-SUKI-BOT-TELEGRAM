// plugins/Reto.js — Reto al azar
const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "🔥");

  const lista = Array.isArray(global.reto) ? global.reto : [];
  if (!lista.length) {
    return conn.sendMessage(chatId, { text: "❌ No tengo retos cargados." }, { quoted: msg });
  }

  const reto = lista[Math.floor(Math.random() * lista.length)].trim();
  await conn.sendMessage(chatId, {
    text: `🔥 *RETO*\n\n${reto}\n\n👤 Para: *${msg.senderName}*`
  }, { quoted: msg });
};

handler.command = ["reto", "dare"];
export default handler;
