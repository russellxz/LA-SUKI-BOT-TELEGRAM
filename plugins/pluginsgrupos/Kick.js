// plugins/pluginsgrupos/Kick.js — Expulsar a un usuario del grupo
import { noEsGrupo, noEsAdmin, botNoPuede, objetivoDe, comoIndicarUsuario, mencion } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_restrict_members")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, { text: comoIndicarUsuario(usedPrefix, command) }, { quoted: msg });
  }

  if (String(objetivo.id) === String(conn.user.id)) {
    return conn.sendMessage(chatId, { text: "🙃 No me voy a expulsar a mí misma." }, { quoted: msg });
  }
  if (global.isOwner(objetivo.id)) {
    return conn.sendMessage(chatId, { text: "👑 No puedo expulsar al dueño del bot." }, { quoted: msg });
  }
  if (await conn.esAdmin(chatId, objetivo.id)) {
    return conn.sendMessage(chatId, { text: "⛔ No puedo expulsar a un administrador del grupo." }, { quoted: msg });
  }

  try {
    await conn.kick(chatId, objetivo.id);
    await conn.sendMessage(chatId, {
      text: `👋 ${mencion(objetivo.id, objetivo.nombre)} fue expulsado del grupo.`
    });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude expulsarlo.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["kick", "echar", "sacar"];
export default handler;
