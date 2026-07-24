// plugins/pluginsgrupos/Setname.js — Cambiar el nombre del grupo
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_change_info")) return;

  const nombre = (text || "").trim();
  if (!nombre) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa: *${usedPrefix}${command} <nuevo nombre>*`
    }, { quoted: msg });
  }
  if (nombre.length > 128) {
    return conn.sendMessage(chatId, { text: "❌ El nombre no puede pasar de 128 caracteres." }, { quoted: msg });
  }

  try {
    await conn.setNombreGrupo(chatId, nombre);
    await conn.react(chatId, msg.message_id, "✅");
    await conn.sendMessage(chatId, { text: `✏️ *Nombre del grupo cambiado a:*\n${nombre}` }, { quoted: msg });
  } catch (e) {
    await conn.sendMessage(chatId, {
      text: `❌ No pude cambiar el nombre.\n\n_${e?.response?.body?.description || e.message}_`
    }, { quoted: msg });
  }
};

handler.command = ["setname", "setnombre"];
export default handler;
