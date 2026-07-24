/**
 * libs/subir.js — Sube un archivo a un hosting público y devuelve la URL.
 *
 * Varias APIs de imágenes (mejorar calidad, convertir a anime, etc.) necesitan
 * que se les pase un enlace, no el archivo. Aquí se intenta con varios
 * servicios hasta que uno responda.
 */

import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

/**
 * @param {Buffer} buffer
 * @param {string} nombre  nombre con extensión, ej: "foto.jpg"
 * @returns {Promise<string>} URL pública del archivo
 */
export async function subirArchivo(buffer, nombre = "archivo.jpg") {
  const errores = [];

  // 1) qu.ax
  try {
    const form = new FormData();
    form.append("files[]", buffer, { filename: nombre });
    const { data } = await axios.post("https://qu.ax/upload.php", form, {
      headers: form.getHeaders(),
      timeout: 60000,
      maxBodyLength: Infinity
    });
    const url = data?.files?.[0]?.url;
    if (url) return url;
    errores.push("qu.ax no devolvió URL");
  } catch (e) {
    errores.push(`qu.ax: ${e.message}`);
  }

  // 2) catbox.moe
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename: nombre });
    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 60000,
      maxBodyLength: Infinity
    });
    if (typeof data === "string" && data.startsWith("http")) return data.trim();
    errores.push("catbox no devolvió URL");
  } catch (e) {
    errores.push(`catbox: ${e.message}`);
  }

  // 3) tmpfiles.org
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: nombre });
    const { data } = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
      timeout: 60000,
      maxBodyLength: Infinity
    });
    const url = data?.data?.url;
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
