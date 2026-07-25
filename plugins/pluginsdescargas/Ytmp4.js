// plugins/pluginsdescargas/Ytmp4.js — Descargar el video de YouTube
import { buscarYoutube, videoYoutube, descargarBuffer } from "../../libs/descargas.js";

const limpiarNombre = (t) => String(t).replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim() || "video";

const handler = async (msg, { conn, text, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text:
        `🎬 *Descargar video de YouTube*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace o nombre>*\n\n` +
        `_Puedes pedir calidad: ${usedPrefix}${command} 720 <enlace>_`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    // Calidad opcional como primer argumento (360, 480, 720, 1080)
    let calidad = "360";
    let consulta = entrada;
    if (/^\d{3,4}p?$/.test(args[0] || "")) {
      calidad = args[0].replace(/p$/i, "");
      consulta = args.slice(1).join(" ");
    }

    let url = consulta;
    let titulo = "YouTube";

    if (!/youtu\.?be|youtube\.com/i.test(consulta)) {
      const resultados = await buscarYoutube(consulta, 1);
      if (!resultados.length) throw new Error("No encontré ese video");
      url = resultados[0].url;
      titulo = resultados[0].titulo;
    }

    const resuelto = await videoYoutube(url, calidad);
    titulo = resuelto.titulo || titulo;

    const { buffer, tam } = await descargarBuffer(resuelto.url);

    await conn.sendMessage(chatId, {
      video: buffer,
      fileName: `${limpiarNombre(titulo)}.mp4`,
      caption: `🎬 *${titulo}*\n📺 Calidad: ${calidad}p\n📦 ${(tam / 1048576).toFixed(1)} MB`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargar el video.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ytmp4", "ytv", "yt4", "y4", "video"];
export default handler;
