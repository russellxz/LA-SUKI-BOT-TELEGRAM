/**
 * libs/subir.js — Sube un archivo al CDN y devuelve el enlace público.
 *
 * El servidor principal es el mismo que usaba el bot de WhatsApp:
 *   https://cdn.russellxz.click/upload.php   (campo "file", respuesta { url })
 *
 * Si ese servidor no contesta se prueban otros de respaldo, para que comandos
 * como .hd, .toanime o las facturas nunca se queden sin enlace.
 */

import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

/** CDN propio (se puede cambiar con la variable de entorno CDN_URL) */
export const CDN = (process.env.CDN_URL || "https://cdn.russellxz.click/upload.php").trim();

const TIEMPO = 120000;

/** Adivina el tipo de archivo por la extensión, para que el CDN lo guarde bien */
function tipoPorNombre(nombre = "") {
  const ext = String(nombre).split(".").pop().toLowerCase();
  const tabla = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    mp3: "audio/mpeg", ogg: "audio/ogg", opus: "audio/ogg", m4a: "audio/mp4",
    wav: "audio/wav", pdf: "application/pdf", zip: "application/zip"
  };
  return tabla[ext] || "application/octet-stream";
}

/** Busca la URL dentro de la respuesta, sin importar cómo venga envuelta */
function sacarUrl(data) {
  if (!data) return null;
  if (typeof data === "string") {
    const limpio = data.trim();
    return /^https?:\/\//i.test(limpio) ? limpio : null;
  }
  return (
    data.url ||
    data.result?.url ||
    data.file?.url ||
    data.data?.url ||
    data.files?.[0]?.url ||
    null
  );
}

/** Sube el archivo al CDN propio (cdn.russellxz.click) */
export async function subirAlCdn(buffer, nombre = "archivo.jpg") {
  const form = new FormData();
  form.append("file", buffer, { filename: nombre, contentType: tipoPorNombre(nombre) });

  const { data } = await axios.post(CDN, form, {
    headers: { ...form.getHeaders(), apikey: "Russellxz" },
    timeout: TIEMPO,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const url = sacarUrl(data);
  if (!url) throw new Error("el CDN no devolvió enlace");
  return url;
}

/**
 * @param {Buffer} buffer
 * @param {string} nombre  nombre con extensión, ej: "foto.jpg"
 * @returns {Promise<string>} URL pública del archivo
 */
export async function subirArchivo(buffer, nombre = "archivo.jpg") {
  const errores = [];

  // 1) CDN propio: es el que devuelve enlaces de russellxz.click
  try {
    return await subirAlCdn(buffer, nombre);
  } catch (e) {
    errores.push(`cdn: ${e.message}`);
  }

  // 2) catbox.moe
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename: nombre });
    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: TIEMPO,
      maxBodyLength: Infinity
    });
    const url = sacarUrl(data);
    if (url) return url;
    errores.push("catbox no devolvió URL");
  } catch (e) {
    errores.push(`catbox: ${e.message}`);
  }

  // 3) qu.ax
  try {
    const form = new FormData();
    form.append("files[]", buffer, { filename: nombre });
    const { data } = await axios.post("https://qu.ax/upload.php", form, {
      headers: form.getHeaders(),
      timeout: TIEMPO,
      maxBodyLength: Infinity
    });
    const url = sacarUrl(data);
    if (url) return url;
    errores.push("qu.ax no devolvió URL");
  } catch (e) {
    errores.push(`qu.ax: ${e.message}`);
  }

  // 4) tmpfiles.org
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: nombre });
    const { data } = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
      timeout: TIEMPO,
      maxBodyLength: Infinity
    });
    const url = sacarUrl(data);
    if (url) return url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    errores.push("tmpfiles no devolvió URL");
  } catch (e) {
    errores.push(`tmpfiles: ${e.message}`);
  }

  throw new Error(`No pude subir el archivo. ${errores.join(" | ")}`);
}

/** Igual que subirArchivo pero desde una ruta del disco */
export async function subirDesdeDisco(ruta) {
  return subirArchivo(fs.readFileSync(ruta), path.basename(ruta));
}

export default subirArchivo;
