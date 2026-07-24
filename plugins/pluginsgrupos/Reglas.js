// plugins/pluginsgrupos/Reglas.js — Ver las reglas del grupo
import { noEsGrupo, estadoChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, usedPrefix } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;

  const reglas = estadoChat(chatId, "reglas");
  if (!reglas) {
    return conn.sendMessage(chatId, {
      text:
        "📜 *Este grupo todavía no tiene reglas.*\n\n" +
        `Un administrador puede ponerlas con:\n*${usedPrefix}setreglas <texto>*`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    text: `📜 *REGLAS DE ${msg.chatName.toUpperCase()}*\n\n${reglas}`
  }, { quoted: msg });
};

handler.command = ["reglas", "rules"];
export default handler;
