// plugins/pluginsgrupos/Setdespedidas.js — Personalizar el mensaje de despedida
import { noEsGrupo, noEsAdmin, setEstadoChat, estadoChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "🚫 Solo los administradores u owners pueden personalizar la despedida.")) return;

  const mensaje = (text || msg.quoted?.text || "").trim();

  if (!mensaje) {
    const actual = estadoChat(chatId, "despedida");
    return conn.sendMessage(chatId, {
      text:
        "✳️ *Personalizar despedida*\n\n" +
        `Usa: *${usedPrefix}${command} <mensaje>*\n` +
        "O responde a un mensaje con el comando.\n\n" +
        "*Etiquetas disponibles:*\n" +
        "• `@user` → menciona al que se va\n" +
        "• `{nombre}` → su nombre\n" +
        "• `{grupo}` → nombre del grupo\n" +
        "• `{total}` → cuántos quedamos\n\n" +
        `*Ejemplo:*\n${usedPrefix}${command} 👋 Adiós @user, se te va a extrañar\n\n` +
        (actual ? `*Despedida actual:*\n${actual}` : "_Ahora mismo uso la despedida por defecto._")
    }, { quoted: msg });
  }

  setEstadoChat(chatId, "despedida", mensaje);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      "✅ *Despedida personalizada guardada.*\n\n" +
      `Recuerda activarla con *${usedPrefix}despedidas on*`
  }, { quoted: msg });
};

handler.command = ["setdespedidas", "setdespedida", "setbye"];
export default handler;
