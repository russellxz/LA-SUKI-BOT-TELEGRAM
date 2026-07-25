// plugins/pluginsdescargas/Ytmp4.js — Video de YouTube, con botones de calidad
//
// Igual que en el bot de WhatsApp: llega la vista previa y eliges la calidad,
// en video normal o en documento. La API es la misma: POST /youtube/resolve
// con { url, type: "video", quality } (la calidad va sin la "p").
import { buscarYoutube, videoYoutube, descargarBuffer, normalizarCalidad, CALIDADES_VIDEO } from "../../libs/descargas.js";
import { menuDescarga, opcionesYoutubeVideo, limpiarNombre } from "../../libs/botonesdescarga.js";

const esYoutube = (u = "") => /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i.test(u);

const handler = async (msg, { conn, text, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text:
        `🎬 *Descargar video de YouTube*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace o nombre>*\n\n` +
        `_También puedes fijar la calidad de una:_\n` +
        `*${usedPrefix}${command} 720 <enlace>*\n\n` +
        `Calidades: ${CALIDADES_VIDEO.join(" · ")}`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    // Si el primer argumento es una calidad, se baja de una sin menú
    let calidadFija = "";
    let consulta = entrada;
    if (/^(144|240|360|720|1080|1440|2160|4k)p?$/i.test(args[0] || "")) {
      calidadFija = normalizarCalidad(args[0]);
      consulta = args.slice(1).join(" ").trim();
    }

    let url = consulta;
    let video = null;

    if (!esYoutube(consulta)) {
      const resultados = await buscarYoutube(consulta, 1);
      if (!resultados.length) throw new Error("No encontré ese video");
      video = resultados[0];
      url = video.url;
    } else {
      video = (await buscarYoutube(consulta, 1).catch(() => []))[0] || null;
    }

    const titulo = video?.titulo || "YouTube Video";

    const preparar = async (calidad) => {
      const resuelto = await videoYoutube(url, calidad);
      const etiqueta = resuelto.calidad === "4k" ? "4K" : `${resuelto.calidad}p`;
      return {
        url: resuelto.url,
        titulo: resuelto.titulo || titulo,
        nombre: `${limpiarNombre(resuelto.titulo || titulo, "video")}.mp4`,
        ext: "mp4",
        caption: `🎬 *${resuelto.titulo || titulo}*\n📺 Calidad: ${etiqueta}`
      };
    };

    if (calidadFija) {
      const aviso = await conn.sendMessage(chatId, { text: "⏳ *Descargando el video...*" }, { quoted: msg });
      const datos = await preparar(calidadFija);
      const { buffer, tam } = await descargarBuffer(datos.url);
      if (aviso?.message_id) await conn.deleteMessage(chatId, aviso.message_id).catch(() => {});
      await conn.sendMessage(chatId, {
        video: buffer,
        fileName: datos.nombre,
        caption: `${datos.caption}\n📦 ${(tam / 1048576).toFixed(2)} MB`
      }, { quoted: msg });
      return conn.react(chatId, msg.message_id, "✅");
    }

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  🎬 *YOUTUBE — VIDEO*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 *Título:* ${titulo}\n` +
      (video?.autor ? `👤 *Canal:* ${video.autor}\n` : "") +
      (video?.duracion ? `⏱️ *Duración:* ${video.duracion}\n` : "") +
      `\n🔗 ${url}`;

    await menuDescarga(conn, msg, {
      titulo,
      info,
      miniatura: video?.miniatura || "",
      enlace: url,
      porFila: 3,
      opciones: opcionesYoutubeVideo(["360", "720", "1080"]),
      resolver: (opcion) => preparar(opcion.calidad)
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude preparar el video.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp4", "ytv", "yt4", "y4", "video"];
export default handler;
