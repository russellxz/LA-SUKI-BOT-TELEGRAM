// plugins/pluginsgrupos/Restchat.js — Reiniciar el conteo de mensajes del grupo
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";
import { reiniciarConteo, totalMensajes } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const antes = totalMensajes(chatId);
  if (!antes) {
    return conn.sendMessage(chatId, { text: "ℹ️ *Este grupo no tiene mensajes contados todavía.*" }, { quoted: msg });
  }

  reiniciarConteo(chatId);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `♻️ *Conteo reiniciado.* Se borraron *${antes}* mensajes del registro.`
  }, { quoted: msg });
};

handler.command = ["restchat", "resetchat"];
export default handler;
