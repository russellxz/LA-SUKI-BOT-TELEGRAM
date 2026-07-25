// plugins/pluginsdescargas/Twitter.js — Descargar de Twitter / X, con botones
import { descargarTwitter } from "../../libs/descargas.js";
import { menuDescarga, opcionesVideo, opcionesImagen, limpiarNombre } from "../../libs/botonesdescarga.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let url = (text || "").trim().replace(/^<|>$/g, "");

  if (/^(www\.)?(twitter\.com|x\.com)\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;

  if (!url || !/twitter\.com|x\.com|t\.co/i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `🐦 *Descargar de Twitter / X*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://x.com/usuario/status/123`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarTwitter(url);
    if (!datos.video && !datos.imagen) throw new Error("Ese tweet no tiene video ni imagen");

    const titulo = datos.titulo || "Twitter / X";
    const esVideo = Boolean(datos.video);

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  🐦 *TWITTER / X*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 ${titulo}`;

    await menuDescarga(conn, msg, {
      titulo,
      info,
      miniatura: datos.imagen || "",
      enlace: url,
      opciones: esVideo ? opcionesVideo() : opcionesImagen(),
      resolver: () => ({
        url: esVideo ? datos.video : datos.imagen,
        titulo,
        nombre: `${limpiarNombre(titulo, "twitter")}.${esVideo ? "mp4" : "jpg"}`,
        ext: esVideo ? "mp4" : "jpg"
      })
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["twitter", "tw", "xdl", "x"];
export default handler;
