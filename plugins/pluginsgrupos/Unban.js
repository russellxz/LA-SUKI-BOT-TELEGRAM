// plugins/pluginsgrupos/Unban.js — Quitar el baneo del bot a un usuario
import { noEsGrupo, noEsAdmin, objetivoDe, comoIndicarUsuario, mencion, listaChat, quitarDeLista } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "❌ Solo *admins* o *dueños* del bot pueden usar este comando.")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    const baneados = listaChat(chatId, "banned");
    const lista = baneados.length
      ? "\n\n*Baneados en este grupo:*\n" + baneados.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n")
      : "\n\n_No hay nadie baneado en este grupo._";
    return conn.sendMessage(chatId, {
      text: "⚠️ Responde, menciona o escribe el ID del usuario que quieres desbanear." + lista
    }, { quoted: msg });
  }

  if (!quitarDeLista(chatId, "banned", objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} no estaba baneado.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ ${mencion(objetivo.id, objetivo.nombre)} ya puede volver a usar el bot.`
  });
};

handler.command = ["unban", "desbanear"];
export default handler;
