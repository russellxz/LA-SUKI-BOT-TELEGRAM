// plugins/pluginsdescargas/Fb.js — Descargar videos de Facebook
import { descargarFacebook, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let url = (text || "").trim().replace(/^<|>$/g, "");

  // Igual que el bot de WhatsApp: se acepta el enlace aunque venga sin https://
  if (/^(www\.)?(facebook\.com|fb\.watch|fb\.me)\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;

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

    // Primero el endpoint de la API (ya sirve el archivo listo) y, si falla,
    // el enlace directo del CDN de Facebook.
    const candidatos = [datos.video, datos.directo].filter((v, i, a) => v && a.indexOf(v) === i);

    let buffer, tam, ultimo;
    for (const enlace of candidatos) {
      try {
        ({ buffer, tam } = await descargarBuffer(enlace));
        break;
      } catch (e) {
        ultimo = e;
        console.log("⚠️ fb:", e.message);
      }
    }
    if (!buffer) throw ultimo || new Error("No pude bajar el video");

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
