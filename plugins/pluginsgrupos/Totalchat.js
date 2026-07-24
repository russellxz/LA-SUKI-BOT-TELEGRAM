// plugins/pluginsgrupos/Totalchat.js — Ranking de actividad del grupo
import { noEsGrupo, mencion } from "../../libs/grupo.js";
import { miembrosDe, totalMensajes } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, usedPrefix } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;

  const miembros = miembrosDe(chatId).filter((u) => !u.bot).sort((a, b) => b.msgs - a.msgs);

  if (!miembros.length) {
    return conn.sendMessage(chatId, {
      text: "📊 *Este grupo aún no tiene mensajes registrados.*"
    }, { quoted: msg });
  }

  const medallas = ["🥇", "🥈", "🥉"];
  const top = miembros.slice(0, 50);
  const ranking = top
    .map((u, i) => `${medallas[i] || `${i + 1}.`} ${mencion(u.id, u.nombre)} — *${u.msgs}* mensajes`)
    .join("\n");

  const activos = miembros.filter((u) => u.msgs > 0).length;

  await conn.sendMessage(chatId, {
    text:
      `📊 *Ranking de actividad*\n` +
      `📍 ${msg.chatName}\n\n` +
      `👥 Usuarios registrados: *${miembros.length}*\n` +
      `🟢 Con actividad: *${activos}*\n` +
      `💬 Total contado: *${totalMensajes(chatId)}* mensajes\n\n` +
      ranking +
      `\n\n_El conteo empieza desde que el bot entró al grupo._\n` +
      `_Para reiniciarlo: ${usedPrefix}restchat_`,
    mentions: top.map((u) => u.id)
  }, { quoted: msg });
};

handler.command = ["totalchat", "ranking", "actividad"];
export default handler;
