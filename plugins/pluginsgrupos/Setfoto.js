// plugins/pluginsgrupos/Setfoto.js — Cambiar la foto del grupo
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_change_info")) return;

  const media = msg.media?.tipo === "imagen" ? msg.media
    : msg.quoted?.media?.tipo === "imagen" ? msg.quoted.media
    : null;

  if (!media) {
    return conn.sendMessage(chatId, {
      text: `🖼️ *Responde a una imagen* con *${usedPrefix}${command}* para ponerla como foto del grupo.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const buffer = await conn.downloadMedia(media.fileId);
    await conn.setFotoGrupo(chatId, buffer);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, { text: "🖼️ *Foto del grupo actualizada.*" }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude cambiar la foto.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["setfoto", "setpp", "setperfil"];
export default handler;
