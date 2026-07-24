// plugins/pluginsgrupos/Antiarabe2.js — Limpieza: expulsa a los miembros
// conocidos que tengan el nombre en alfabeto árabe.
import { noEsGrupo, noEsAdmin, botNoPuede, mencion } from "../../libs/grupo.js";
import { miembrosDe } from "../../libs/usuarios.js";

const RE_ARABE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

const handler = async (msg, ctx) => {
  const { conn } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_restrict_members")) return;

  await conn.react(chatId, msg.message_id, "⏳");

  const candidatos = miembrosDe(chatId).filter((u) => RE_ARABE.test(u.nombre || ""));
  if (!candidatos.length) {
    return conn.sendMessage(chatId, {
      text:
        "✅ *No encontré a nadie con nombre en árabe* entre los miembros que conozco.\n\n" +
        "_Telegram no deja listar todos los miembros de un grupo: solo puedo revisar a quienes he visto escribir o entrar._"
    }, { quoted: msg });
  }

  const expulsados = [];
  for (const u of candidatos) {
    if (global.isOwner(u.id) || String(u.id) === String(conn.user.id)) continue;
    if (await conn.esAdmin(chatId, u.id)) continue;
    try {
      await conn.kick(chatId, u.id);
      expulsados.push(u);
      await new Promise((r) => setTimeout(r, 600));
    } catch {}
  }

  await conn.sendMessage(chatId, {
    text: expulsados.length
      ? `🚫 *Expulsados ${expulsados.length}:*\n\n` + expulsados.map((u) => `• ${mencion(u.id, u.nombre)}`).join("\n")
      : "⚠️ No pude expulsar a ninguno (puede que sean admins o que Telegram lo impida)."
  }, { quoted: msg });
};

handler.command = ["antiarabe2", "limpiararabes"];
export default handler;
