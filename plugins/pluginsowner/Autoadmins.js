// plugins/pluginsowner/Autoadmins.js — El dueño se da admin a sí mismo
import { noEsGrupo, botNoPuede, mencion } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, isOwner, senderId } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ Solo el *dueño del bot* puede usar este comando."
    }, { quoted: msg });
  }

  if (await conn.esAdmin(chatId, senderId)) {
    return conn.sendMessage(chatId, { text: "✅ *Ya eres administrador del grupo.*" }, { quoted: msg });
  }

  if (await botNoPuede(msg, conn, "can_promote_members")) return;

  try {
    await conn.promote(chatId, senderId);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, {
      text: `👑 ${mencion(senderId, msg.senderName)} ahora es *administrador* del grupo.`
    }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude darte admin.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["autoadmins", "reclaim"];
export default handler;
