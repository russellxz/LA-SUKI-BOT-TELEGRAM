// plugins/pluginsdescargas/Spotify.js — Descargar canciones de Spotify, con botones
import { descargarSpotify, buscarYoutube, audioYoutube } from "../../libs/descargas.js";
import { menuDescarga, opcionesAudio, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, recortar } from "../../libs/estilo.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "🟢",
        nombre: "Descargar de Spotify",
        para: "Pásame el enlace de la canción o su nombre.",
        usos: [`${usedPrefix}${command} <enlace o nombre>`],
        ejemplos: [`${usedPrefix}${command} https://open.spotify.com/track/xxxx`]
      })
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    let titulo, artista, enlace, portada = "";

    if (/open\.spotify\.com/i.test(entrada)) {
      const datos = await descargarSpotify(entrada);
      if (!datos.audio) throw new Error("No pude sacar el audio de ese enlace");
      titulo = datos.titulo;
      artista = datos.artista;
      enlace = datos.audio;
      portada = datos.miniatura || "";
    } else {
      // Si escriben el nombre, se busca en YouTube
      const resultados = await buscarYoutube(entrada, 1);
      if (!resultados.length) throw new Error("No encontré esa canción");
      const resuelto = await audioYoutube(resultados[0].url);
      titulo = resuelto.titulo || resultados[0].titulo;
      artista = resultados[0].autor;
      enlace = resuelto.url;
      portada = resultados[0].miniatura || "";
    }

    await menuDescarga(conn, msg, {
      emoji: "🟢",
      fuente: "Spotify",
      nombre: titulo,
      miniatura: portada,
      datos: [["🎤", "Artista", artista || null]],
      opciones: opcionesAudio(),
      resolver: () => ({
        url: enlace,
        titulo,
        autor: artista || "Spotify",
        nombre: `${limpiarNombre(titulo, "cancion")}.mp3`,
        ext: "mp3",
        caption: `🟢 *${recortar(titulo, 60)}*${artista ? `\n🎤 ${artista}` : ""}`
      })
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarla.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["spotify", "sp"];
export default handler;
