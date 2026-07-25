// plugins/pluginsdescargas/Ig.js — Descargar fotos y videos de Instagram
//
// Con los mismos botones que el bot de WhatsApp: normal o documento. Si la
// publicación trae varios archivos (carrusel), se mandan todos con la opción
// que elijas.
import { descargarInstagram, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga } from "../../libs/botonesdescarga.js";

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

    const videos = items.filter((x) => x.tipo === "video").length;
    const fotos = items.length - videos;

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  📸 *INSTAGRAM*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📦 *Archivos:* ${items.length}` +
      (videos ? `\n🎬 Videos: ${videos}` : "") +
      (fotos ? `\n🖼️ Fotos: ${fotos}` : "");

    // Un solo archivo: el menú lo baja y lo manda
    if (items.length === 1) {
      const uno = items[0];
      const esVideo = uno.tipo === "video";
      return void (await menuDescarga(conn, msg, {
        titulo: "Instagram",
        info,
        enlace: url,
        opciones: esVideo
          ? [{ id: "v", texto: "🎬 Video Normal", tipo: "video" }, { id: "vd", texto: "📁 Video Documento", tipo: "documento" }]
          : [{ id: "i", texto: "🖼️ Imagen", tipo: "imagen" }, { id: "idoc", texto: "📄 Imagen Documento", tipo: "documento" }],
        resolver: () => ({
          url: uno.url,
          titulo: "Instagram",
          nombre: `instagram.${esVideo ? "mp4" : "jpg"}`,
          ext: esVideo ? "mp4" : "jpg"
        })
      }).then(() => conn.react(chatId, msg.message_id, "✅")));
    }

    // Carrusel: el botón decide si van normales o como documento
    await menuDescarga(conn, msg, {
      titulo: "Instagram",
      info,
      enlace: url,
      opciones: [
        { id: "todo", texto: "📥 Todo normal", tipo: "lote" },
        { id: "tododoc", texto: "📁 Todo como documento", tipo: "lote", documento: true }
      ],
      resolver: async (opcion) => {
        let enviados = 0;
        let ultimo = null;

        for (const item of items) {
          try {
            const { buffer, tipo } = await descargarBuffer(item.url);
            const esVideo = tipo.startsWith("video/") || (!tipo.startsWith("image/") && item.tipo === "video");
            const nombre = `instagram_${++enviados}.${esVideo ? "mp4" : "jpg"}`;

            const contenido = opcion.documento
              ? { document: buffer, fileName: nombre, caption: "📸 *Instagram*" }
              : esVideo
                ? { video: buffer, fileName: nombre, caption: "📸 *Instagram*" }
                : { image: buffer, caption: "📸 *Instagram*" };

            await conn.sendMessage(chatId, contenido, { quoted: msg });
          } catch (e) {
            enviados--;
            ultimo = e;
            console.log("⚠️ ig:", e.message);
          }
          await new Promise((r) => setTimeout(r, 500));
        }

        if (enviados <= 0) throw new Error(`No pude bajar ninguno de los archivos${ultimo ? ` (${ultimo.message})` : ""}`);
        return { yaEnviado: true }; // los archivos ya se mandaron aquí
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 250)}_\n\n_Las cuentas privadas no se pueden descargar._`
    }, { quoted: msg });
  }
};

handler.command = ["instagram", "ig"];
export default handler;
