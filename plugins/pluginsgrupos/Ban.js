// plugins/pluginsgrupos/Ban.js — Prohibir que un usuario use el bot en el grupo
import { noEsGrupo, noEsAdmin, objetivoDe, comoIndicarUsuario, mencion, listaChat, agregarALista } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "❌ Solo *admins* o *dueños* del bot pueden usar este comando.")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Responde, menciona o escribe el ID del usuario que quieres banear.*\n\n" + comoIndicarUsuario(usedPrefix, command)
    }, { quoted: msg });
  }

  if (global.isOwner(objetivo.id)) {
    return conn.sendMessage(chatId, { text: "👑 No puedes banear al dueño del bot." }, { quoted: msg });
  }
  if (String(objetivo.id) === String(conn.user.id)) {
    return conn.sendMessage(chatId, { text: "🙃 No me voy a banear a mí misma." }, { quoted: msg });
  }

  if (listaChat(chatId, "banned").includes(String(objetivo.id))) {
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} ya estaba baneado.`
    }, { quoted: msg });
  }

  agregarALista(chatId, "banned", objetivo.id);
  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `🚫 ${mencion(objetivo.id, objetivo.nombre)} fue *baneado*.\n\n` +
      `Ya no podrá usar ningún comando del bot en este grupo.\n` +
      `Para quitarle el baneo: *${usedPrefix}unban*`
  });
};

handler.command = ["ban", "banear"];
export default handler;
