// plugins/pluginsdescargas/Spotify.js — Descargar canciones de Spotify
import { descargarSpotify, buscarYoutube, audioYoutube, descargarBuffer } from "../../libs/descargas.js";

const limpiarNombre = (t) => String(t).replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim() || "audio";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const entrada = (text || "").trim();

  if (!entrada) {
    return conn.sendMessage(chatId, {
      text:
        `🟢 *Descargar de Spotify*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace o nombre>*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} https://open.spotify.com/track/xxxx`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    let titulo, artista, enlace;

    if (/open\.spotify\.com/i.test(entrada)) {
      const datos = await descargarSpotify(entrada);
      if (!datos.audio) throw new Error("No pude sacar el audio de ese enlace");
      titulo = datos.titulo;
      artista = datos.artista;
      enlace = datos.audio;
    } else {
      // Si escriben el nombre, se busca en YouTube
      const resultados = await buscarYoutube(entrada, 1);
      if (!resultados.length) throw new Error("No encontré esa canción");
      const resuelto = await audioYoutube(resultados[0].url);
      titulo = resuelto.titulo || resultados[0].titulo;
      artista = resultados[0].autor;
      enlace = resuelto.url;
    }

    const { buffer, tam } = await descargarBuffer(enlace);

    await conn.sendMessage(chatId, {
      audio: buffer,
      fileName: `${limpiarNombre(titulo)}.mp3`,
      title: titulo,
      performer: artista || "Spotify",
      caption: `🟢 *${titulo}*\n${artista ? `🎤 ${artista}\n` : ""}📦 ${(tam / 1048576).toFixed(1)} MB`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarla.\n\n_${String(e?.message || e).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["spotify", "sp"];
export default handler;
