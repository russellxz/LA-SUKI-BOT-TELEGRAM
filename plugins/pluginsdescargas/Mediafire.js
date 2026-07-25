// plugins/pluginsdescargas/Mediafire.js — Descargar archivos de MediaFire
//
// Primero se muestra la ficha del archivo y con el botón se baja: como
// documento (lo normal) o, si es un video, también se puede mandar reproducible.
import { neoxr, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga } from "../../libs/botonesdescarga.js";

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const enlace = args.join(" ").trim();
  const pref = usedPrefix || global.prefixes?.[0] || ".";

  if (!enlace) {
    return conn.sendMessage(chatId, {
      text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo:\n${pref}${command} https://www.mediafire.com/file/ejemplo/file.zip`
    }, { quoted: msg });
  }

  if (!/^https?:\/\/(www\.)?mediafire\.com/i.test(enlace)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ *Enlace no válido.*\n📌 Tiene que ser una URL de MediaFire.\n\nEjemplo:\n${pref}${command} https://www.mediafire.com/file/ejemplo/file.zip`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await neoxr("/mediafire", { url: enlace });
    const archivo = datos?.url ? datos : datos?.data || datos;
    if (!archivo?.url) throw new Error("No pude obtener el enlace de descarga");

    const nombre = archivo.title || "archivo";
    const esVideo = /video\//i.test(archivo.mime || "") || /\.(mp4|mkv|webm|avi)$/i.test(nombre);

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  📂 *MEDIAFIRE*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 *Nombre:* ${nombre}\n` +
      (archivo.size ? `💾 *Tamaño:* ${archivo.size}\n` : "") +
      (archivo.mime ? `📦 *Tipo:* ${archivo.mime}\n` : "") +
      (archivo.extension ? `🏷️ *Extensión:* ${archivo.extension}` : "");

    const opciones = [{ id: "f", texto: "📁 Descargar archivo", tipo: "documento" }];
    if (esVideo) opciones.unshift({ id: "v", texto: "🎬 Ver como video", tipo: "video" });

    await menuDescarga(conn, msg, {
      titulo: nombre,
      info,
      enlace,
      opciones,
      resolver: async () => {
        const { buffer, tam } = await descargarBuffer(archivo.url);
        return { buffer, tam, titulo: nombre, nombre, caption: `📂 *${nombre}*` };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    console.error("❌ Error en .mediafire:", e.message);
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ *No pude procesar ese MediaFire.*\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["mediafire"];
export default handler;
