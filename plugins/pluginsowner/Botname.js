// plugins/pluginsowner/Botname.js — Cambiar el nombre del bot
const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Solo el dueño del bot puede cambiarle el nombre.*" }, { quoted: msg });
  }

  const nombre = (text || "").trim();
  if (!nombre) {
    return conn.sendMessage(chatId, {
      text:
        `✳️ Usa: *${usedPrefix}${command} <nuevo nombre>*\n\n` +
        `*Nombre actual:* ${conn.user.nombre}\n` +
        "_Máximo 64 caracteres._"
    }, { quoted: msg });
  }
  if (nombre.length > 64) {
    return conn.sendMessage(chatId, { text: "❌ El nombre no puede pasar de 64 caracteres." }, { quoted: msg });
  }

  try {
    await conn.bot.setMyName(nombre);
    conn.user.nombre = nombre;
    conn.user.name = nombre;
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, {
      text: `✏️ *Nombre del bot cambiado a:* ${nombre}\n\n_Telegram puede tardar unos minutos en mostrarlo._`
    }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text:
        `❌ No pude cambiar el nombre.\n\n_${e?.response?.body?.description || e.message}_\n\n` +
        "_Telegram solo deja cambiarlo unas pocas veces al día._"
    }, { quoted: msg });
  }
};

handler.command = ["botname", "setbotname"];
export default handler;
