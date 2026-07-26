// plugins/pluginsgrupos/Infogrupo.js — Información del grupo
import { noEsGrupo } from "../../libs/grupo.js";
import { miembrosDe, totalMensajes } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const chat = await conn.getChat(chatId, true);
    const admins = await conn.getAdmins(chatId, true);
    let miembros = 0;
    try {
      miembros = await conn.bot.getChatMemberCount(chatId);
    } catch {}

    const creador = admins.find((a) => a.status === "creator");
    const listaAdmins = admins
      .filter((a) => !a.user.is_bot)
      .map((a) => `• ${[a.user.first_name, a.user.last_name].filter(Boolean).join(" ")}${a.status === "creator" ? " 👑" : ""}`)
      .join("\n");

    const texto =
      `📋 *INFO DEL GRUPO*\n` +
      `>| 🏷️ *Nombre:* ${chat.title}\n` +
      `>| 🆔 *ID:* \`${chat.id}\`\n` +
      `>| 👥 *Miembros:* ${miembros}\n` +
      `>| 👮 *Admins:* ${admins.length}\n` +
      `>| 👑 *Creador:* ${creador ? [creador.user.first_name, creador.user.last_name].filter(Boolean).join(" ") : "Oculto"}\n` +
      `>| 💬 *Mensajes contados:* ${totalMensajes(chatId)}\n` +
      `>| 🙋 *Miembros que conozco:* ${miembrosDe(chatId).length}\n` +
      (chat.username ? `>| 🔗 *Enlace:* t.me/${chat.username}\n` : "") +
      `\n\n` +
      (chat.description ? `📝 *Descripción:*\n${chat.description}\n\n` : "") +
      (listaAdmins ? `👮 *Administradores:*\n${listaAdmins}` : "");

    const foto = await conn.profilePictureUrl(null, chatId);
    if (foto) await conn.sendMessage(chatId, { image: foto, caption: texto }, { quoted: msg });
    else await conn.sendMessage(chatId, { text: texto }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude obtener la información.\n\n_${e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["infogrupo", "grupoinfo", "infogp"];
export default handler;
