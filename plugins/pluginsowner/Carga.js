// plugins/pluginsowner/Carga.js — Recargar los plugins sin reiniciar el bot
const handler = async (msg, ctx) => {
  const { conn, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ Este comando es solo para el *dueño del bot*." }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  const antes = global.plugins.length;

  try {
    const total = await global.recargarPlugins();
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, {
      text:
        "♻️ *Plugins recargados*\n\n" +
        `📦 Antes: *${antes}*\n` +
        `📦 Ahora: *${total}*\n` +
        `⚡ Comandos: *${global.pluginIndex.size}*`
    }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, { text: `❌ Error recargando: ${e.message}` }, { quoted: msg });
  }
};

handler.command = ["carga", "reload", "recargar"];
export default handler;
