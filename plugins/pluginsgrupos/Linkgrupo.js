// plugins/pluginsgrupos/Linkgrupo.js — Obtener el enlace de invitación del grupo
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_invite_users")) return;

  try {
    const link = await conn.linkGrupo(chatId);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, {
      text: `🔗 *Enlace de ${msg.chatName}:*\n\n${link}`
    }, { quoted: msg, preview: true });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude obtener el enlace.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["linkgrupo", "link", "enlace"];
export default handler;
