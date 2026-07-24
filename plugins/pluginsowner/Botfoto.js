// plugins/pluginsowner/Botfoto.js — Foto y descripción del bot
//
// La Bot API NO permite cambiar la foto de perfil del bot (eso solo se puede
// desde @BotFather). Lo que sí se puede cambiar por aquí es la descripción,
// así que el comando hace eso y explica cómo cambiar la foto.
const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Solo el dueño del bot puede usar este comando.*" }, { quoted: msg });
  }

  const descripcion = (text || msg.quoted?.text || "").trim();

  if (!descripcion) {
    return conn.sendMessage(chatId, {
      text:
        "🖼️ *Foto y descripción del bot*\n\n" +
        "*Para cambiar la FOTO del bot:*\n" +
        "Telegram solo lo permite desde @BotFather:\n" +
        "1. Abre @BotFather\n" +
        "2. Envía */setuserpic*\n" +
        "3. Elige este bot y manda la imagen\n\n" +
        "*Para cambiar la DESCRIPCIÓN:*\n" +
        `*${usedPrefix}${command} <texto>*\n` +
        "_Es lo que se ve al abrir el chat con el bot._"
    }, { quoted: msg });
  }

  if (descripcion.length > 512) {
    return conn.sendMessage(chatId, { text: "❌ La descripción no puede pasar de 512 caracteres." }, { quoted: msg });
  }

  try {
    await conn.bot.setMyDescription(descripcion);
    if (descripcion.length <= 120) await conn.bot.setMyShortDescription(descripcion).catch(() => {});
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, { text: "📝 *Descripción del bot actualizada.*" }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude actualizarla.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["botfoto", "botdesc", "setbotfoto"];
export default handler;
