// plugins/pluginsdescargas/Tiktok.js — Descargar de TikTok sin marca de agua
//
// Con los mismos botones que el bot de WhatsApp: video normal, video documento
// y el audio suelto. Las publicaciones de solo fotos se mandan directas.
import { descargarTiktok, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, duracion, recortar } from "../../libs/estilo.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let url = (text || "").trim().replace(/^<|>$/g, "");

  if (/^(www\.)?(vm\.|vt\.)?tiktok\.com\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;

  if (!url || !/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url)) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "🎵",
        nombre: "Descargar de TikTok",
        para: "Sin marca de agua, en video o solo el audio.",
        usos: [`${usedPrefix}${command} <enlace>`],
        ejemplos: [`${usedPrefix}${command} https://vm.tiktok.com/xxxxx`]
      })
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarTiktok(url);
    const titulo = datos.titulo || "TikTok";

    // Publicaciones de solo fotos: se mandan tal cual, no hay nada que elegir
    if (!datos.video && datos.imagenes?.length) {
      for (const imagen of datos.imagenes.slice(0, 10)) {
        const enlace = typeof imagen === "string" ? imagen : imagen.url;
        try {
          const { buffer } = await descargarBuffer(enlace);
          await conn.sendMessage(chatId, { image: buffer });
        } catch {
          await conn.sendMessage(chatId, { image: enlace });
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (datos.audio) {
        try {
          const { buffer } = await descargarBuffer(datos.audio);
          await conn.sendMessage(chatId, { audio: buffer, fileName: "tiktok.mp3", title: titulo });
        } catch {}
      }
      return conn.react(chatId, msg.message_id, "✅");
    }

    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    const opciones = [
      { id: "v", texto: "🎬 Video", tipo: "video" },
      { id: "vd", texto: "📄 Documento", tipo: "documento" }
    ];
    if (datos.audio) opciones.push({ id: "a", texto: "🎵 Solo audio", tipo: "audio" });

    await menuDescarga(conn, msg, {
      emoji: "🎵",
      fuente: "TikTok",
      nombre: titulo,
      miniatura: datos.portada || "",
      datos: [
        ["👤", "Autor", datos.autor || null],
        ["⏱️", "Duración", datos.duracion ? duracion(datos.duracion) : null]
      ],
      enlace: url,
      opciones,
      resolver: (opcion) =>
        opcion.tipo === "audio"
          ? { url: datos.audio, titulo, nombre: `${limpiarNombre(titulo, "tiktok")}.mp3`, ext: "mp3" }
          : { url: datos.video, titulo, nombre: `${limpiarNombre(titulo, "tiktok")}.mp4`, ext: "mp4" }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tiktok", "tt", "tiktok2", "tt2", "ttt", "tiktoktest"];
export default handler;
