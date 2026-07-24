// plugins/pluginsgrupos/Delwelcomedespedidas.js — Borrar los textos personalizados
import { noEsGrupo, noEsAdmin, setEstadoChat, estadoChat } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, usedPrefix } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const tenia = estadoChat(chatId, "bienvenida") || estadoChat(chatId, "despedida");
  setEstadoChat(chatId, "bienvenida", null);
  setEstadoChat(chatId, "despedida", null);

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: tenia
      ? `🗑️ *Listo.* Borré la bienvenida y la despedida personalizadas.\n\nAhora vuelvo a usar los mensajes por defecto.\n_Para poner los tuyos: ${usedPrefix}setwelcome / ${usedPrefix}setdespedidas_`
      : "ℹ️ Este grupo no tenía textos personalizados guardados."
  }, { quoted: msg });
};

handler.command = ["delwelcome", "delbienvenida", "deldespedida"];
export default handler;
