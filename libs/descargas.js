/**
 * libs/descargas.js — Cliente de las APIs de descarga.
 *
 * Todos los comandos de descarga (play, tiktok, facebook, spotify...) pasan por
 * aquí, así hay un solo sitio donde cambiar claves o servidores.
 *
 * Se puede configurar con variables de entorno:
 *   API_BASE   → servidor principal   (por defecto el de Sky Ultra Plus)
 *   API_KEY    → clave de ese servidor
 *   NEOXR_KEY  → clave de la API de respaldo
 */

import axios from "axios";

export const API_BASE = (process.env.API_BASE || "https://api-sky.ultraplus.click").replace(/\/+$/, "");
export const API_KEY = process.env.API_KEY || "Russellxz";
export const NEOXR_BASE = "https://api.neoxr.eu/api";
export const NEOXR_KEY = process.env.NEOXR_KEY || "russellxz";

const TIEMPO = 180000;

/** ¿La respuesta de la API viene bien? */
function respuestaOk(data) {
  return data && (data.status === true || data.status === "true" || data.ok === true || data.success === true);
}

/** Completa las rutas relativas que devuelve la API */
export function urlCompleta(url) {
  if (!url) return "";
  return String(url).startsWith("/") ? API_BASE + url : String(url);
}

/** Llamada GET a la API principal */
export async function apiGet(ruta, params = {}) {
  const r = await axios.get(`${API_BASE}${ruta}`, {
    params,
    timeout: TIEMPO,
    headers: { apikey: API_KEY, Accept: "application/json, */*" },
    validateStatus: () => true
  });
  const data = typeof r.data === "object" ? r.data : null;
  if (!data) throw new Error("El servidor no devolvió JSON");
  if (!respuestaOk(data)) throw new Error(data.message || data.error || "La API devolvió un error");
  return data.result || data.data || data;
}

/** Llamada POST a la API principal */
export async function apiPost(ruta, body = {}) {
  const r = await axios.post(`${API_BASE}${ruta}`, body, {
    timeout: TIEMPO,
    headers: { "Content-Type": "application/json", apikey: API_KEY, Accept: "application/json, */*" },
    validateStatus: () => true
  });
  const data = typeof r.data === "object" ? r.data : null;
  if (!data) throw new Error("El servidor no devolvió JSON");
  if (!respuestaOk(data)) throw new Error(data.message || data.error || "La API devolvió un error");
  return data.result || data.data || data;
}

/** Llamada a la API de respaldo (neoxr) */
export async function neoxr(ruta, params = {}) {
  const r = await axios.get(`${NEOXR_BASE}${ruta}`, {
    params: { ...params, apikey: NEOXR_KEY },
    timeout: TIEMPO,
    headers: { Accept: "application/json, */*" },
    validateStatus: () => true
  });
  const data = typeof r.data === "object" ? r.data : null;
  if (!data) throw new Error("El servidor no devolvió JSON");
  if (!respuestaOk(data)) throw new Error(data.message || data.error || "La API de respaldo devolvió un error");
  return data.data || data.result || data;
}

/* ─────────────────────── YouTube ─────────────────────── */

/** Busca en YouTube y devuelve los resultados */
export async function buscarYoutube(consulta, limite = 8) {
  const { default: yts } = await import("yt-search");
  const r = await yts(consulta);
  return (r.videos || []).slice(0, limite).map((v) => ({
    titulo: v.title,
    url: v.url,
    duracion: v.timestamp,
    segundos: v.seconds,
    vistas: v.views,
    autor: v.author?.name || "",
    miniatura: v.thumbnail,
    subido: v.ago
  }));
}

/**
 * Resuelve un video de YouTube a un enlace descargable.
 * @param {"audio"|"video"} tipo
 * @param {string} calidad  "128kbps" | "360p" | "720p" ...
 */
export async function resolverYoutube(url, tipo = "audio", calidad = null) {
  // 1) API principal
  try {
    const cuerpo = tipo === "video"
      ? { url, type: "video", quality: calidad || "360p" }
      : { url, type: "audio", format: calidad || "mp3" };

    const resultado = await apiPost("/youtube/resolve", cuerpo);
    const enlace = urlCompleta(resultado?.media?.dl_download || resultado?.media?.direct);
    if (enlace) {
      return {
        titulo: resultado.title || "YouTube",
        miniatura: resultado.thumbnail || "",
        url: enlace
      };
    }
  } catch (e) {
    console.log("⚠️ API principal falló:", e.message);
  }

  // 2) API de respaldo
  const datos = await neoxr("/youtube", {
    url,
    type: tipo,
    quality: tipo === "video" ? (calidad || "360p") : (calidad || "128kbps")
  });

  const enlace = datos?.url || datos?.data?.url;
  if (!enlace) throw new Error("Ninguna API pudo darme el enlace de descarga");

  return {
    titulo: datos.title || datos?.data?.title || "YouTube",
    miniatura: datos.thumbnail || "",
    url: enlace
  };
}

/* ─────────────────────── Otras redes ─────────────────────── */

export async function descargarTiktok(url) {
  const datos = await apiGet("/tiktok", { url });
  return {
    titulo: datos.title || datos.desc || "TikTok",
    autor: datos.author?.nickname || datos.author || "",
    video: urlCompleta(datos.video || datos.play || datos.nowatermark || datos.media?.video),
    audio: urlCompleta(datos.music || datos.audio || datos.media?.audio),
    imagenes: datos.images || datos.media?.images || []
  };
}

export async function descargarFacebook(url) {
  const datos = await apiGet("/facebook", { url });
  const opciones = datos.media || datos.links || datos;
  const video =
    urlCompleta(opciones.hd || opciones.sd || opciones.url || opciones.video) ||
    urlCompleta(Array.isArray(opciones) ? opciones[0]?.url : "");
  return { titulo: datos.title || "Facebook", video };
}

export async function descargarInstagram(url) {
  try {
    const datos = await apiGet("/instagram", { url });
    const lista = datos.media || datos.data || datos.result || [];
    return Array.isArray(lista) ? lista : [lista];
  } catch {
    const datos = await neoxr("/ig", { url });
    const lista = datos.data || datos;
    return Array.isArray(lista) ? lista : [lista];
  }
}

export async function descargarTwitter(url) {
  const datos = await apiGet("/twitter", { url });
  const media = datos.media || datos;
  return {
    titulo: datos.title || datos.description || "Twitter / X",
    video: urlCompleta(media.hd || media.sd || media.url || media.video),
    imagen: urlCompleta(media.image || media.thumbnail)
  };
}

export async function descargarSpotify(url) {
  const datos = await apiGet("/spotify", { url });
  return {
    titulo: datos.title || datos.name || "Spotify",
    artista: datos.artist || datos.artists || "",
    miniatura: datos.thumbnail || datos.image || "",
    audio: urlCompleta(datos.url || datos.media?.audio || datos.download)
  };
}

export default {
  API_BASE, API_KEY, NEOXR_BASE, NEOXR_KEY,
  apiGet, apiPost, neoxr, urlCompleta,
  buscarYoutube, resolverYoutube,
  descargarTiktok, descargarFacebook, descargarInstagram, descargarTwitter, descargarSpotify
};
