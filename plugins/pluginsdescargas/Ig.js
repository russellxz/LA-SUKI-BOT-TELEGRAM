// plugins/pluginsdescargas/Ig.js — Descargar fotos y videos de Instagram
import { descargarInstagram, descargarBuffer } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let url = (text || "").trim().replace(/^<|>$/g, "");

  if (/^(www\.)?(instagram\.com|instagr\.am)\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;

  if (!url || !/instagram\.com|instagr\.am/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `📸 *Descargar de Instagram*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://www.instagram.com/p/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    // Ya vienen normalizados: { url, tipo: "video" | "imagen" }
    const items = (await descargarInstagram(url)).filter((x) => x?.url);
    if (!items.length) throw new Error("No encontré nada en ese enlace");

    let enviados = 0;
    let ultimo = null;

    for (const item of items) {
      try {
        const { buffer, tipo } = await descargarBuffer(item.url);

        // Lo que diga el servidor manda sobre lo que adivinamos por el enlace
        const esVideo = tipo.startsWith("video/") || (!tipo.startsWith("image/") && item.tipo === "video");

        await conn.sendMessage(chatId, esVideo
          ? { video: buffer, fileName: "instagram.mp4", caption: "📸 *Instagram*" }
          : { image: buffer, caption: "📸 *Instagram*" }
        , { quoted: msg });
        enviados++;
      } catch (e) {
        ultimo = e;
        console.log("⚠️ ig:", e.message);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!enviados) throw new Error(`No pude bajar ninguno de los archivos${ultimo ? ` (${ultimo.message})` : ""}`);
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 200)}_\n\n_Las cuentas privadas no se pueden descargar._`
    }, { quoted: msg });
  }
};

handler.command = ["instagram", "ig"];
export default handler;
