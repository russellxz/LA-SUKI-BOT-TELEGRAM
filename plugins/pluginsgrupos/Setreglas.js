// plugins/pluginsgrupos/Setreglas.js — Definir las reglas del grupo
import { noEsGrupo, noEsAdmin, setEstadoChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const reglas = (text || msg.quoted?.text || "").trim();

  if (!reglas) {
    return conn.sendMessage(chatId, {
      text:
        "✳️ *Escribe las reglas del grupo*\n\n" +
        `Usa: *${usedPrefix}${command} <reglas>*\n` +
        "O responde a un mensaje con el comando.\n\n" +
        `*Ejemplo:*\n${usedPrefix}${command} 1. Respeto\n2. Nada de spam\n3. Prohibido +18`
    }, { quoted: msg });
  }

  setEstadoChat(chatId, "reglas", reglas);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ *Reglas guardadas.* Cualquiera puede verlas con *${usedPrefix}reglas*`
  }, { quoted: msg });
};

handler.command = ["setreglas", "setrules"];
export default handler;
