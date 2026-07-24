// plugins/pluginsgrupos/Fantasmas.js — Ver quiénes casi no escriben
import { noEsGrupo, noEsAdmin, mencion } from "../../libs/grupo.js";
import { miembrosDe } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const limite = parseInt(args[0]);
  if (Number.isNaN(limite)) {
    return conn.sendMessage(chatId, {
      text:
        "👻 *Detector de fantasmas*\n\n" +
        `Usa: *${usedPrefix}${command} <número de mensajes>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} 10\n` +
        "_Muestra a quienes tienen menos de 10 mensajes._"
    }, { quoted: msg });
  }

  const admins = await conn.getAdmins(chatId);
  const idsAdmin = new Set(admins.map((a) => String(a.user.id)));

  const fantasmas = miembrosDe(chatId)
    .filter((u) => !u.bot && !idsAdmin.has(u.id) && !global.isOwner(u.id) && u.msgs < limite)
    .sort((a, b) => a.msgs - b.msgs);

  if (!fantasmas.length) {
    return conn.sendMessage(chatId, {
      text: `🎉 *No hay fantasmas.* Todos los que conozco tienen ${limite} mensajes o más.`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    text:
      `👻 *FANTASMAS DEL GRUPO*\n` +
      `_(menos de ${limite} mensajes)_\n\n` +
      fantasmas.slice(0, 60).map((u, i) => `${i + 1}. ${mencion(u.id, u.nombre)} — *${u.msgs}*`).join("\n") +
      `\n\n📊 Total: *${fantasmas.length}*\n\n` +
      "⚠️ _El conteo solo cubre desde que el bot entró al grupo, y solo a quienes he visto escribir._\n" +
      `_Para expulsarlos: ${usedPrefix}fankick ${limite}_`,
    mentions: fantasmas.slice(0, 60).map((u) => u.id)
  }, { quoted: msg });
};

handler.command = ["fantasmas", "ghost"];
export default handler;
