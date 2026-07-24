// plugins/pluginsgrupos/Setinfo.js — Cambiar la descripción del grupo
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_change_info")) return;

  const descripcion = (text || msg.quoted?.text || "").trim();
  if (!descripcion) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa: *${usedPrefix}${command} <descripción>*\nO responde a un mensaje con el comando.`
    }, { quoted: msg });
  }
  if (descripcion.length > 255) {
    return conn.sendMessage(chatId, { text: "❌ La descripción no puede pasar de 255 caracteres." }, { quoted: msg });
  }

  try {
    await conn.setDescripcionGrupo(chatId, descripcion);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, { text: "📝 *Descripción del grupo actualizada.*" }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude cambiar la descripción.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["setinfo", "setdesc", "setdescripcion"];
export default handler;
