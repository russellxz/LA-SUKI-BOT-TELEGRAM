// plugins/pluginsowner/Vergrupos.js — Ver los grupos donde está el bot
import { listarChats } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ Este comando solo puede usarlo el *dueño del bot*."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  const grupos = listarChats("grupo").sort((a, b) => b.visto - a.visto);
  const privados = listarChats("privado").length;

  if (!grupos.length) {
    return conn.sendMessage(chatId, {
      text: "📭 Todavía no tengo grupos registrados.\n\n_Voy anotando cada grupo donde me escriben._"
    }, { quoted: msg });
  }

  const lineas = [];
  for (const g of grupos) {
    let miembros = "?";
    try {
      miembros = await conn.bot.getChatMemberCount(g.id);
    } catch {}
    lineas.push(`>| 📌 *${g.titulo}*\n>|    🆔 \`${g.id}\` · 👥 ${miembros}`);
  }

  const tandas = [];
  for (let i = 0; i < lineas.length; i += 25) tandas.push(lineas.slice(i, i + 25));

  for (let i = 0; i < tandas.length; i++) {
    const encabezado = i === 0
      ? `👥 *MIS GRUPOS*\n>| Total: *${grupos.length}* grupos\n>| Chats privados: *${privados}*\n\n`
      : "\n";
    await conn.sendMessage(chatId, {
      text: encabezado + tandas[i].join("\n") + "\n"
    }, { quoted: i === 0 ? msg : undefined });
  }

  await conn.react(chatId, msg.message_id, "✅");
};

handler.command = ["vergrupos", "grupos"];
export default handler;
