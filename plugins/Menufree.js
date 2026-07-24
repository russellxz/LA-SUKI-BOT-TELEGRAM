// plugins/Menufree.js — Menú corto con lo más usado
const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  const p = usedPrefix;
  await conn.react(chatId, msg.message_id, "✨");

  await conn.sendMessage(chatId, {
    text:
`✨ *LO MÁS USADO DE LA SUKI BOT* ✨

🎵 ${p}play <nombre> — bajar música
🎬 ${p}ytmp4 <enlace> — bajar video
🎨 ${p}s — hacer un sticker
🤖 ${p}chatgpt <texto> — preguntar a la IA
🗣️ ${p}tts <texto> — texto a voz
💾 ${p}guar <palabra> — guardar multimedia
👮 ${p}menugrupo — administrar el grupo
📦 ${p}menu — el menú completo

💜 _Escribe ${p}allmenu para verlo TODO_`
  }, { quoted: msg });
};

handler.command = ["menufree", "menucorto"];
export default handler;
