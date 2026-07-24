// plugins/pluginsowner/Addlista.js — Agregar usuarios a la lista VIP del bot
import { objetivoDe, comoIndicarUsuario, mencion, listaChat, agregarALista } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ Este comando solo lo puede usar el *dueño del bot*."
    }, { quoted: msg });
  }

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    const lista = listaChat("global", "vip");
    return conn.sendMessage(chatId, {
      text:
        "⚠️ *Indica a quién agregar a la lista VIP.*\n\n" +
        comoIndicarUsuario(usedPrefix, command) +
        (lista.length ? `\n\n*Lista actual (${lista.length}):*\n` + lista.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n") : "")
    }, { quoted: msg });
  }

  if (!agregarALista("global", "vip", objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ ${mencion(objetivo.id, objetivo.nombre)} ya estaba en la lista.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ ${mencion(objetivo.id, objetivo.nombre)} fue agregado a la *lista VIP*.`
  }, { quoted: msg });
};

handler.command = ["addlista", "addvip"];
export default handler;
