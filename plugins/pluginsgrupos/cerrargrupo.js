// plugins/pluginsgrupos/cerrargrupo.js — Cerrar el grupo (solo admins escriben)
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_restrict_members")) return;

  try {
    await conn.cerrarGrupo(chatId, true);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, { text: "🔒 *Grupo cerrado.* Solo los administradores pueden escribir." });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude cerrar el grupo.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["cerrargrupo", "closegroup"];
export default handler;
