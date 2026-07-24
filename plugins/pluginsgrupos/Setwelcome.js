// plugins/pluginsgrupos/Setwelcome.js — Personalizar el mensaje de bienvenida
import { noEsGrupo, noEsAdmin, setEstadoChat, estadoChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "🚫 Solo los administradores u owners pueden personalizar la bienvenida.")) return;

  const mensaje = (text || msg.quoted?.text || "").trim();

  if (!mensaje) {
    const actual = estadoChat(chatId, "bienvenida");
    return conn.sendMessage(chatId, {
      text:
        "✳️ *Personalizar bienvenida*\n\n" +
        `Usa: *${usedPrefix}${command} <mensaje>*\n` +
        "O responde a un mensaje con el comando.\n\n" +
        "*Etiquetas disponibles:*\n" +
        "• `@user` → menciona al que entra\n" +
        "• `{nombre}` → su nombre\n" +
        "• `{grupo}` → nombre del grupo\n" +
        "• `{total}` → cuántos miembros somos\n\n" +
        `*Ejemplo:*\n${usedPrefix}${command} 💖 Bienvenid@ @user a {grupo}, ya somos {total}!\n\n` +
        (actual ? `*Bienvenida actual:*\n${actual}` : "_Ahora mismo uso la bienvenida por defecto._")
    }, { quoted: msg });
  }

  setEstadoChat(chatId, "bienvenida", mensaje);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      "✅ *Bienvenida personalizada guardada.*\n\n" +
      `Recuerda activarla con *${usedPrefix}welcome on*`
  }, { quoted: msg });
};

handler.command = ["setwelcome", "setbienvenida"];
export default handler;
