// plugins/pluginsdescargas/Mediafire.js — Descargar archivos de MediaFire
//
// Primero se muestra la ficha del archivo y con el botón se baja: como
// documento (lo normal) o, si es un video, también se puede mandar reproducible.
import { neoxr, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga } from "../../libs/botonesdescarga.js";
import { ayuda, recortar } from "../../libs/estilo.js";

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const enlace = args.join(" ").trim();
  const pref = usedPrefix || global.prefixes?.[0] || ".";

  if (!enlace) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "📂",
        nombre: "Descargar de MediaFire",
        para: "Pásame el enlace del archivo.",
        usos: [`${pref}${command} <enlace>`],
        ejemplos: [`${pref}${command} https://www.mediafire.com/file/ejemplo/file.zip`]
      })
    }, { quoted: msg });
  }

  if (!/^https?:\/\/(www\.)?mediafire\.com/i.test(enlace)) {
    return conn.sendMessage(chatId, {
      text: `⚠️ *Ese enlace no es de MediaFire*\n\nEjemplo: \`${pref}${command} https://www.mediafire.com/file/ejemplo/file.zip\``
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await neoxr("/mediafire", { url: enlace });
    const archivo = datos?.url ? datos : datos?.data || datos;
    if (!archivo?.url) throw new Error("No pude obtener el enlace de descarga");

    const nombre = archivo.title || "archivo";
    const esVideo = /video\//i.test(archivo.mime || "") || /\.(mp4|mkv|webm|avi)$/i.test(nombre);

    const opciones = [{ id: "f", texto: "📥 Descargar", tipo: "documento" }];
    if (esVideo) opciones.unshift({ id: "v", texto: "🎬 Ver video", tipo: "video" });

    await menuDescarga(conn, msg, {
      emoji: "📂",
      fuente: "MediaFire",
      nombre,
      enlace,
      datos: [
        ["💾", "Tamaño", archivo.size || null],
        ["📦", "Tipo", archivo.mime || null],
        ["🏷️", "Extensión", archivo.extension || null]
      ],
      opciones,
      resolver: async () => {
        const { buffer, tam } = await descargarBuffer(archivo.url);
        return { buffer, tam, titulo: nombre, nombre, caption: `📂 *${recortar(nombre, 60)}*` };
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
