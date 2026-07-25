/**
 * plugins/Tourl.js — Sube un archivo al CDN y devuelve el enlace.
 *
 * Usa el mismo servidor que el bot de WhatsApp: cdn.russellxz.click,
 * así los enlaces salen igualitos (https://cdn.russellxz.click/xxxxxxx.jpg).
 *
 * Se puede usar de dos formas:
 *   • Respondiendo a una foto, video, audio, sticker o documento
 *   • Pasándole un enlace:  .tourl https://sitio.com/foto.jpg
 */

import axios from "axios";
import { subirAlCdn, subirArchivo, CDN } from "../libs/subir.js";

const MAXIMO = 200 * 1024 * 1024; // el CDN acepta hasta 200 MB

/** Extensión a partir del tipo de archivo que informa el servidor */
function extPorMime(mime = "") {
  const tabla = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
    "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/wav": "wav",
    "application/pdf": "pdf", "application/zip": "zip"
  };
  return tabla[String(mime).toLowerCase().split(";")[0].trim()] || null;
}

/** Deja el nombre limpio y siempre con extensión */
function nombreSeguro(nombre, mime, respaldo = "bin") {
  let base = String(nombre || `archivo_${Date.now()}`).replace(/[^A-Za-z0-9_\-.]+/g, "_");
  if (!/\.[A-Za-z0-9]{1,5}$/.test(base)) base += `.${extPorMime(mime) || respaldo}`;
  return base.slice(0, 120);
}

const pesar = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

const handler = async (msg, { conn, usedPrefix, command, args }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);
  const enlace = (args?.[0] || "").trim();

  if (!media && !/^https?:\/\//i.test(enlace)) {
    return conn.sendMessage(chatId, {
      text:
        "🔗 *Subir archivo al CDN*\n\n" +
        `📌 Responde a una foto, video, audio, sticker o documento con *${usedPrefix}${command}*\n` +
        `📌 O pásale un enlace: *${usedPrefix}${command} https://sitio.com/foto.jpg*\n\n` +
        "Te devuelvo un enlace directo de *cdn.russellxz.click*"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "☁️");

  try {
    let buffer;
    let nombre;

    if (media) {
      buffer = await conn.downloadMedia(media.fileId);
      nombre = nombreSeguro(media.fileName, media.mime, media.ext || "bin");
    } else {
      const { data, headers } = await axios.get(enlace, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: MAXIMO,
        maxBodyLength: Infinity,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      buffer = Buffer.from(data);
      const base = decodeURIComponent(new URL(enlace).pathname.split("/").pop() || "archivo");
      nombre = nombreSeguro(base, headers["content-type"]);
    }

    if (!buffer?.length) throw new Error("El archivo llegó vacío");
    if (buffer.length > MAXIMO) throw new Error("El archivo pasa de 200 MB");

    // Primero el CDN propio; si se cae, se usa un espejo para no dejar al usuario sin enlace
    let url;
    let espejo = false;
    try {
      url = await subirAlCdn(buffer, nombre);
    } catch (e) {
      console.log("⚠️ CDN principal falló:", e.message);
      url = await subirArchivo(buffer, nombre);
      espejo = !url.includes("russellxz.click");
    }

    await conn.sendMessage(chatId, {
      text:
        "✅ *Archivo subido exitosamente:*\n" +
        `${url}\n\n` +
        `📦 Tipo: ${media?.tipo || "enlace"}\n` +
        `📏 Peso: ${pesar(buffer.length)}` +
        (espejo ? `\n\n⚠️ _${new URL(CDN).host} no respondió, se usó un servidor de respaldo._` : "")
    }, { quoted: msg, preview: true });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ *No pude subir el archivo.*\n\n_${String(e.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["tourl", "tourl2", "tourl3", "subir", "url"];
export default handler;
