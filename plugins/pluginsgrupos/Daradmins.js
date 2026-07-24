// plugins/pluginsgrupos/Daradmins.js — Dar administrador a un usuario
import { noEsGrupo, noEsAdmin, botNoPuede, objetivoDe, comoIndicarUsuario, mencion } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_promote_members")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, { text: comoIndicarUsuario(usedPrefix, command) }, { quoted: msg });
  }

  if (await conn.esAdmin(chatId, objetivo.id)) {
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} ya es administrador.`
    }, { quoted: msg });
  }

  try {
    await conn.promote(chatId, objetivo.id);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, {
      text: `⭐ ${mencion(objetivo.id, objetivo.nombre)} ahora es *administrador* del grupo.`
    });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude darle admin.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["daradmins", "promote", "daradmin"];
export default handler;
