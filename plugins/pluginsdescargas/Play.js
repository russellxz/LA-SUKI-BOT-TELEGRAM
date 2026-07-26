// plugins/pluginsdescargas/Play.js — Buscar y descargar de YouTube
//
// Manda UNA sola tarjeta con la portada, la ficha de la canción y los botones.
// Al pulsar, la propia tarjeta se va editando ("⏳ Bajando…", "✅ enviado") en
// vez de llenar el chat de mensajes sueltos.
import { buscarYoutube, audioYoutube, videoYoutube } from "../../libs/descargas.js";
import { menuDescarga, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, duracion, numero, recortar } from "../../libs/estilo.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const consulta = (text || "").trim();

  if (!consulta) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "🎧",
        nombre: "Buscar en YouTube",
        para: "Te busco la canción y tú eliges si la quieres en audio o en video.",
        usos: [`${usedPrefix}${command} <nombre o enlace>`],
        ejemplos: [`${usedPrefix}${command} bad bunny diles`, `${usedPrefix}${command} https://youtu.be/xxxx`]
      })
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const esEnlace = /youtu\.?be|youtube\.com/i.test(consulta);
    const resultados = await buscarYoutube(consulta, 1).catch(() => []);

    let video = resultados[0];
    if (!video) {
      if (!esEnlace) throw new Error("No encontré nada con ese nombre");
      video = { titulo: "Video de YouTube", url: consulta, duracion: "", autor: "", miniatura: "", vistas: 0 };
    }
    if (esEnlace) video.url = resultados[0]?.url || consulta;

    await menuDescarga(conn, msg, {
      emoji: "🎧",
      fuente: "YouTube",
      nombre: video.titulo,
      miniatura: video.miniatura || "",
      enlace: video.url,
      porFila: 2,
      datos: [
        ["👤", "Canal", video.autor || null],
        ["⏱️", "Duración", video.duracion || (video.segundos ? duracion(video.segundos) : null)],
        ["👁️", "Vistas", video.vistas ? numero(video.vistas) : null],
        ["📅", "Subido", video.subido || null]
      ],
      opciones: [
        { id: "a", texto: "🎵 Audio MP3", tipo: "audio" },
        { id: "ad", texto: "📄 Audio doc", tipo: "documento", audio: true },
        { id: "v360", texto: "🎬 Video 360p", tipo: "video", calidad: "360" },
        { id: "d360", texto: "📄 360p doc", tipo: "documento", calidad: "360" },
        { id: "v720", texto: "📺 Video 720p", tipo: "video", calidad: "720" },
        { id: "d720", texto: "📄 720p doc", tipo: "documento", calidad: "720" }
      ],
      resolver: async (opcion) => {
        const esAudio = opcion.tipo === "audio" || opcion.audio;

        if (esAudio) {
          const r = await audioYoutube(video.url);
          const nombre = r.titulo || video.titulo;
          return {
            url: r.url,
            titulo: nombre,
            autor: video.autor || r.autor || "YouTube",
            nombre: `${limpiarNombre(nombre, "audio")}.mp3`,
            ext: "mp3",
            caption: `🎵 *${recortar(nombre, 60)}*${video.autor ? `\n👤 ${video.autor}` : ""}`
          };
        }

        const r = await videoYoutube(video.url, opcion.calidad || "360");
        const nombre = r.titulo || video.titulo;
        const etiqueta = r.calidad === "4k" ? "4K" : `${r.calidad}p`;
        return {
          url: r.url,
          titulo: nombre,
          nombre: `${limpiarNombre(nombre, "video")}.mp4`,
          ext: "mp4",
          caption: `🎬 *${recortar(nombre, 60)}*\n📺 ${etiqueta}`
        };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ *No pude buscar eso*\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["play", "play2", "playtest", "musica"];
export default handler;
