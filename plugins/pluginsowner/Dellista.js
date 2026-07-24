// plugins/pluginsowner/Dellista.js — Quitar usuarios de la lista VIP
import { objetivoDe, comoIndicarUsuario, mencion, listaChat, quitarDeLista } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ Este comando solo lo puede usar el *dueño del bot*."
    }, { quoted: msg });
  }

  const lista = listaChat("global", "vip");
  const objetivo = objetivoDe(msg, args);

  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text:
        comoIndicarUsuario(usedPrefix, command) +
        (lista.length
          ? `\n\n*Lista VIP (${lista.length}):*\n` + lista.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n")
          : "\n\n_La lista VIP está vacía._")
    }, { quoted: msg });
  }

  if (!quitarDeLista("global", "vip", objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ ${mencion(objetivo.id, objetivo.nombre)} no estaba en la lista.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🗑️ ${mencion(objetivo.id, objetivo.nombre)} salió de la *lista VIP*.`
  }, { quoted: msg });
};

handler.command = ["dellista", "delvip"];
export default handler;
