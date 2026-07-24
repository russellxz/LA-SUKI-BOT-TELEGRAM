// plugins/Ping.js — Comprobar que el bot responde y a qué velocidad
const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const inicio = Date.now();

  const enviado = await conn.sendMessage(chatId, { text: "🏓 Pong..." }, { quoted: msg });
  const ping = Date.now() - inicio;

  const arriba = process.uptime();
  const h = Math.floor(arriba / 3600);
  const m = Math.floor((arriba % 3600) / 60);
  const s = Math.floor(arriba % 60);

  const texto =
    "🏓 *Pong*\n\n" +
    `⚡ Respuesta: *${ping} ms*\n` +
    `⏱️ Encendida hace: *${h}h ${m}m ${s}s*\n` +
    `📦 Comandos cargados: *${global.pluginIndex?.size || 0}*`;

  if (enviado?.message_id) await conn.editMessage(chatId, enviado.message_id, texto);
  else await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["ping", "p2"];
export default handler;
