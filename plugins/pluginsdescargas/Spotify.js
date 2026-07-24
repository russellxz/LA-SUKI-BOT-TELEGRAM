// plugins/pluginsdescargas/Spotify.js — Descargar canciones de Spotify
import { descargarSpotify, buscarYoutube, resolverYoutube } from "../../libs/descargas.js";

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
    if (/open\.spotify\.com/i.test(entrada)) {
      const datos = await descargarSpotify(entrada);
      if (!datos.audio) throw new Error("No pude sacar el audio de ese enlace");

      await conn.sendMessage(chatId, {
        audio: { url: datos.audio },
        fileName: `${datos.titulo}.mp3`.replace(/[\\/:*?"<>|]/g, ""),
        title: datos.titulo,
        performer: datos.artista || "Spotify"
      }, { quoted: msg });
    } else {
      // Si escriben el nombre, se busca en YouTube
      const resultados = await buscarYoutube(entrada, 1);
      if (!resultados.length) throw new Error("No encontré esa canción");
      const resultado = await resolverYoutube(resultados[0].url, "audio", "mp3");

      await conn.sendMessage(chatId, {
        audio: { url: resultado.url },
        fileName: `${resultados[0].titulo}.mp3`.replace(/[\\/:*?"<>|]/g, ""),
        title: resultados[0].titulo,
        performer: resultados[0].autor || ""
      }, { quoted: msg });
    }

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarla.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["spotify", "sp"];
export default handler;
