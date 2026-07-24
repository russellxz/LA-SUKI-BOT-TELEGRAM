// plugins/pluginsgrupos/Todos.js — Mencionar a todos los miembros conocidos
//
// Nota de Telegram: la Bot API no deja listar los miembros de un grupo, así que
// se menciona a quienes el bot ha visto escribir o entrar (más los admins).
import { noEsGrupo, noEsAdmin, mencion } from "../../libs/grupo.js";
import { miembrosDe } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, text } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  await conn.react(chatId, msg.message_id, "⏳");

  const admins = await conn.getAdmins(chatId);
  const ids = new Map();

  for (const a of admins) {
    if (a.user.is_bot) continue;
    ids.set(String(a.user.id), [a.user.first_name, a.user.last_name].filter(Boolean).join(" "));
  }
  for (const u of miembrosDe(chatId)) {
    if (u.bot) continue;
    ids.set(String(u.id), u.nombre);
  }

  if (!ids.size) {
    return conn.sendMessage(chatId, {
      text: "😕 Todavía no conozco a nadie de este grupo.\n\n_Voy aprendiendo a la gente conforme escribe._"
    }, { quoted: msg });
  }

  const aviso = (text || "").trim();
  const lista = [...ids.entries()].map(([id, nombre]) => `• ${mencion(id, nombre)}`);

  // Telegram corta los mensajes largos: se envía por tandas de 50
  const tandas = [];
  for (let i = 0; i < lista.length; i += 50) tandas.push(lista.slice(i, i + 50));

  for (let i = 0; i < tandas.length; i++) {
    const encabezado = i === 0
      ? `📢 *ATENCIÓN ${msg.chatName.toUpperCase()}*\n\n${aviso ? `💬 ${aviso}\n\n` : ""}`
      : "";
    await conn.sendMessage(chatId, {
      text: encabezado + tandas[i].join("\n"),
      mentions: [...ids.keys()]
    });
    if (i < tandas.length - 1) await new Promise((r) => setTimeout(r, 800));
  }

  await conn.react(chatId, msg.message_id, "✅");
};

handler.command = ["tagall", "invocar", "todos"];
export default handler;
