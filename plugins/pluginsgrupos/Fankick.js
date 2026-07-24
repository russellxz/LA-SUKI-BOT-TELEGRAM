// plugins/pluginsgrupos/Fankick.js — Expulsar a los que casi no escriben
import { noEsGrupo, noEsAdmin, botNoPuede, mencion } from "../../libs/grupo.js";
import { miembrosDe } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_restrict_members")) return;

  const limite = parseInt(args[0]);
  if (Number.isNaN(limite)) {
    return conn.sendMessage(chatId, {
      text:
        "🧹 *Expulsar fantasmas*\n\n" +
        `Usa: *${usedPrefix}${command} <número de mensajes>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} 10\n` +
        "⚠️ _Expulsa a quienes tengan menos de ese número de mensajes._\n" +
        `_Míralos antes con ${usedPrefix}fantasmas ${limite || 10}_`
    }, { quoted: msg });
  }

  const admins = await conn.getAdmins(chatId);
  const idsAdmin = new Set(admins.map((a) => String(a.user.id)));

  const candidatos = miembrosDe(chatId).filter(
    (u) => !u.bot && !idsAdmin.has(u.id) && !global.isOwner(u.id) && String(u.id) !== String(conn.user.id) && u.msgs < limite
  );

  if (!candidatos.length) {
    return conn.sendMessage(chatId, {
      text: `🎉 *No hay a quién expulsar.* Todos tienen al menos ${limite} mensajes o están protegidos.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendMessage(chatId, { text: `🧹 Expulsando a *${candidatos.length}* usuarios inactivos...` }, { quoted: msg });

  const expulsados = [];
  const fallidos = [];
  for (const u of candidatos) {
    try {
      await conn.kick(chatId, u.id);
      expulsados.push(u);
    } catch {
      fallidos.push(u);
    }
    await new Promise((r) => setTimeout(r, 700));
  }

  await conn.sendMessage(chatId, {
    text:
      `✅ *Limpieza terminada*\n\n` +
      `👋 Expulsados: *${expulsados.length}*\n` +
      (fallidos.length ? `⚠️ No pude expulsar: *${fallidos.length}*\n` : "") +
      (expulsados.length ? "\n" + expulsados.slice(0, 30).map((u) => `• ${u.nombre}`).join("\n") : "")
  }, { quoted: msg });
};

handler.command = ["fankick", "kickfantasmas"];
export default handler;
