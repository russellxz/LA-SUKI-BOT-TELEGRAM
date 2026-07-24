// plugins/pluginsgrupos/tag.js — Avisar a todos citando un mensaje (sin ver la lista)
import { noEsGrupo, noEsAdmin } from "../../libs/grupo.js";
import { miembrosDe } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  const aviso = (text || msg.quoted?.text || "").trim();
  if (!aviso) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa: *${usedPrefix}${command} <mensaje>*\nO responde a un mensaje con el comando.`
    }, { quoted: msg });
  }

  const admins = await conn.getAdmins(chatId);
  const ids = new Set();
  for (const a of admins) if (!a.user.is_bot) ids.add(String(a.user.id));
  for (const u of miembrosDe(chatId)) if (!u.bot) ids.add(String(u.id));

  // Menciones invisibles: etiqueta a todos sin llenar el mensaje de nombres
  const invisibles = [...ids].map((id) => `@${id}`).join(" ");

  await conn.sendMessage(chatId, {
    text: `📢 *AVISO PARA TODOS*\n\n${aviso}\n\n${invisibles}`,
    mentions: [...ids]
  });
  await conn.react(chatId, msg.message_id, "✅");
};

handler.command = ["tag", "n", "notify"];
export default handler;
