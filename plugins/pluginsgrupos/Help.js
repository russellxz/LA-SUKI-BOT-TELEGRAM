// plugins/pluginsgrupos/Help.js — Información del bot
const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "🤔");

  const texto =
    "🌐 *INFORMACIÓN DEL BOT* 🌐\n\n" +
    "💫 Soy *La Suki Bot*, un bot de Telegram con sistema de plugins.\n\n" +
    "*¿Qué puedo hacer?*\n" +
    "❖ Administrar grupos (antilink, bienvenidas, expulsar, silenciar...)\n" +
    "❖ Crear stickers de fotos, videos y GIFs\n" +
    "❖ Descargar música y videos\n" +
    "❖ Guardar multimedia con palabras clave\n" +
    "❖ Juegos, RPG y economía\n\n" +
    `📌 Usa *${usedPrefix}menu* para ver todos mis comandos.\n` +
    `📌 Usa *${usedPrefix}menugrupo* para los comandos de administración.\n\n` +
    "⚠️ *Para que funcione al 100% en grupos* necesito:\n" +
    "• Ser *administrador* del grupo\n" +
    "• Tener el modo privacidad desactivado (lo hace mi dueño en @BotFather)\n\n" +
    "🎬 Canal del creador: https://youtube.com/@skyultraplus";

  await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["info", "help", "ayuda"];
export default handler;
