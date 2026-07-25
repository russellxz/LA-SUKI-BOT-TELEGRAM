// plugins/pluginsdescargas/Fb.js — Descargar videos de Facebook
import { descargarFacebook, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = (text || "").trim();

  if (!url || !/facebook\.com|fb\.watch|fb\.me/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `📘 *Descargar de Facebook*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplos:*\n• ${usedPrefix}${command} https://fb.watch/xxxx\n• ${usedPrefix}${command} https://www.facebook.com/share/v/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  const aviso = await conn.sendMessage(chatId, { text: "⏳ *Descargando el video de Facebook...*" }, { quoted: msg });

  try {
    const datos = await descargarFacebook(url);
    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    let buffer, tam;
    try {
      ({ buffer, tam } = await descargarBuffer(datos.video));
    } catch (e) {
      // Si el proxy de la API falla, se prueba con el enlace directo
      if (!datos.directo || datos.directo === datos.video) throw e;
      ({ buffer, tam } = await descargarBuffer(datos.directo));
    }

    if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id);

    await conn.sendMessage(chatId, {
      video: buffer,
      fileName: "facebook.mp4",
      caption: `📘 *Facebook*\n${datos.titulo || ""}\n📦 ${(tam / 1048576).toFixed(1)} MB`.trim()
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id);
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text:
        `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_\n\n` +
        "_Los videos privados o de cuentas cerradas no se pueden bajar._"
    }, { quoted: msg });
  }
};

handler.command = ["facebook", "fb"];
export default handler;
