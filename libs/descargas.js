/**
 * libs/descargas.js — Cliente de las APIs de descarga.
 *
 * IMPORTANTE: las APIs exigen la clave en la cabecera `apikey`. Telegram NO
 * puede descargar esas URLs por su cuenta (por eso salía el error
 * "failed to get HTTP URL content"), así que el bot baja el archivo él mismo
 * con `descargarBuffer()` y sube los bytes. Es justo lo que hacía la versión
 * de WhatsApp.
 *
 * Variables de entorno opcionales:
 *   API_BASE   → servidor principal
 *   API_KEY    → clave de ese servidor
 *   NEOXR_KEY  → clave de la API de respaldo
 */

import axios from "axios";

export const API_BASE = (process.env.API_BASE || "https://api-sky.ultraplus.click").replace(/\/+$/, "");
export const API_KEY = process.env.API_KEY || "Russellxz";
export const NEOXR_BASE = (process.env.NEOXR_BASE || "https://api.neoxr.eu/api").replace(/\/+$/, "");
export const NEOXR_KEY = process.env.NEOXR_KEY || "russellxz";

const TIEMPO = 180000;

/** Telegram no deja subir archivos de más de 50 MB con la Bot API normal */
export const MAX_SUBIDA = 49 * 1024 * 1024;

const NAVEGADOR =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * ¿La URL es de nuestra API? Se compara con API_BASE (así funciona aunque el
 * dueño ponga su propio servidor con la variable API_BASE) y con los dominios
 * conocidos.
 */
const esApiPropia = (url = "") => {
  const u = String(url);
  if (u.startsWith("/")) return true;
  if (u.startsWith(API_BASE)) return true;
  try {
    const host = new URL(u).host;
    return host === new URL(API_BASE).host || /(?:api-sky|ultraplus)\./i.test(host);
  } catch {
    return false;
  }
};

const esNeoxr = (url = "") => /neoxr\./i.test(String(url));

/** Página desde la que "viene" la descarga (algunos CDN la exigen) */
function refererDe(url = "") {
  const u = String(url);
  if (/cdninstagram|fbcdn\.net.*instagram|instagram\./i.test(u)) return "https://www.instagram.com/";
  if (/fbcdn\.net|facebook\.|fb\.watch/i.test(u)) return "https://www.facebook.com/";
  if (/tiktokcdn|tiktok\./i.test(u)) return "https://www.tiktok.com/";
  if (/twimg\.com|twitter\.|x\.com/i.test(u)) return "https://twitter.com/";
  return "";
}

function respuestaOk(data) {
  return Boolean(
    data &&
      (data.status === true || data.status === "true" ||
        data.ok === true || data.success === true ||
        data.code === 200 || data.status === 200)
  );
}

/** Completa las rutas relativas que devuelve la API */
export function urlCompleta(url) {
  if (!url) return "";
  return String(url).startsWith("/") ? API_BASE + url : String(url);
}

/* ─────────────────── Llamadas a las APIs ─────────────────── */

/** POST a la API principal (así es como espera los datos) */
export async function apiPost(ruta, body = {}) {
  const r = await axios.post(`${API_BASE}${ruta}`, body, {
    timeout: TIEMPO,
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json"
    },
    validateStatus: () => true
  });

  let data = r.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data.trim());
    } catch {
      throw new Error(`El servidor respondió algo que no es JSON (HTTP ${r.status})`);
    }
  }
  if (!data) throw new Error(`Respuesta vacía del servidor (HTTP ${r.status})`);
  if (!respuestaOk(data)) throw new Error(data.message || data.error || `Error del servidor (HTTP ${r.status})`);

  return data.result || data.data || data;
}

/** GET a la API principal (para los endpoints que lo usan) */
export async function apiGet(ruta, params = {}) {
  const r = await axios.get(`${API_BASE}${ruta}`, {
    params,
    timeout: TIEMPO,
    headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    validateStatus: () => true
  });

  let data = r.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data.trim());
    } catch {
      throw new Error(`El servidor respondió algo que no es JSON (HTTP ${r.status})`);
    }
  }
  if (!respuestaOk(data)) throw new Error(data?.message || data?.error || `Error del servidor (HTTP ${r.status})`);
  return data.result || data.data || data;
}

/**
 * GET a la API de respaldo (neoxr).
 *
 * neoxr pone el título y la miniatura FUERA de `data`, así que se devuelve el
 * contenido de `data` con los datos de arriba mezclados: si no, el título se
 * perdía y las canciones llegaban llamándose "YouTube".
 */
export async function neoxr(ruta, params = {}) {
  const r = await axios.get(`${NEOXR_BASE}${ruta}`, {
    params: { ...params, apikey: NEOXR_KEY },
    timeout: TIEMPO,
    headers: { Accept: "application/json, */*" },
    validateStatus: () => true
  });

  const data = typeof r.data === "object" ? r.data : null;
  if (!data) throw new Error("La API de respaldo no devolvió JSON");
  if (!(respuestaOk(data) || data.result || data.data)) {
    throw new Error(data.message || data.error || "Error en la API de respaldo");
  }

  const dentro = data.data || data.result;
  if (!dentro || typeof dentro !== "object" || Array.isArray(dentro)) return dentro || data;

  const meta = {};
  for (const clave of ["title", "thumbnail", "thumb", "duration", "channel", "author", "fileName", "filename", "size"]) {
    if (data[clave] !== undefined && dentro[clave] === undefined) meta[clave] = data[clave];
  }
  return { ...meta, ...dentro };
}

/* ─────────────────── Descarga de archivos ─────────────────── */

/**
 * Descarga un archivo y devuelve el buffer, poniendo la clave en la cabecera
 * cuando hace falta. Así el archivo lo sube el bot y no depende de que
 * Telegram pueda entrar a la URL.
 *
 * @returns {Promise<{ buffer: Buffer, tipo: string, tam: number }>}
 */
export async function descargarBuffer(url, { maximo = MAX_SUBIDA, referer = "" } = {}) {
  if (!url) throw new Error("No hay enlace de descarga");

  const headers = { "User-Agent": NAVEGADOR, Accept: "*/*" };
  if (esApiPropia(url)) headers.apikey = API_KEY;
  if (esNeoxr(url)) headers.apikey = NEOXR_KEY;

  // Los CDN de Instagram y Facebook cortan la descarga si no viene el Referer
  const deDonde = referer || refererDe(url);
  if (deDonde) headers.Referer = deDonde;

  const r = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: TIEMPO,
    headers,
    maxRedirects: 5,
    maxContentLength: maximo + 1024 * 1024,
    maxBodyLength: Infinity,
    validateStatus: () => true
  });

  if (r.status >= 400) throw new Error(`El servidor devolvió HTTP ${r.status}`);

  const buffer = Buffer.from(r.data);
  if (!buffer.length) throw new Error("La descarga vino vacía");
  if (buffer.length > maximo) {
    const mb = (buffer.length / 1048576).toFixed(1);
    throw new Error(`El archivo pesa ${mb} MB y Telegram solo deja subir 50 MB`);
  }

  return {
    buffer,
    tipo: String(r.headers["content-type"] || "").split(";")[0],
    tam: buffer.length
  };
}

/** Busca el primer enlace utilizable dentro de la respuesta de una API */
export function buscarEnlace(objeto, claves = ["dl_download", "download", "url", "direct", "link", "media", "file"]) {
  if (!objeto) return "";
  if (typeof objeto === "string") return /^https?:\/\/|^\//.test(objeto) ? objeto : "";

  for (const clave of claves) {
    const valor = objeto[clave];
    if (typeof valor === "string" && /^https?:\/\/|^\//.test(valor)) return valor;
  }
  for (const valor of Object.values(objeto)) {
    if (valor && typeof valor === "object") {
      const encontrado = buscarEnlace(valor, claves);
      if (encontrado) return encontrado;
    }
  }
  return "";
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

/** Calidades de video que acepta la API (igual que en el bot de WhatsApp) */
export const CALIDADES_VIDEO = ["144", "240", "360", "720", "1080", "1440", "4k"];
export const CALIDAD_POR_DEFECTO = "360";
export const CALIDAD_AUDIO = "128kbps";

/**
 * Recorre TODA la respuesta buscando enlaces y se queda con el que más pinta
 * tiene de ser el archivo. Es el mismo recorrido que hacía el bot de WhatsApp:
 * las APIs meten el enlace en sitios distintos según el vídeo.
 */
export function buscarEnlaceProfundo(objeto, extensiones = /\.(mp3|m4a|webm|opus|ogg|mp4|mkv)(\?|#|$)/i) {
  const encontrados = [];

  const recorrer = (valor) => {
    if (!valor) return;
    if (typeof valor === "string") {
      if (/^https?:\/\//i.test(valor)) encontrados.push(valor);
      return;
    }
    if (Array.isArray(valor)) return valor.forEach(recorrer);
    if (typeof valor === "object") Object.values(valor).forEach(recorrer);
  };

  recorrer(objeto);

  return (
    encontrados.find((u) => extensiones.test(u)) ||
    encontrados.find((u) => /download|audio|video|youtube|cdn|media/i.test(u)) ||
    encontrados[0] ||
    ""
  );
}

/**
 * Audio de YouTube.
 *
 * Usa la misma API que el bot de WhatsApp: neoxr /youtube con
 * type=audio&quality=128kbps. Si esa falla se prueba con la principal.
 *
 * @returns {Promise<{ titulo, url, miniatura, autor }>}
 */
export async function audioYoutube(url) {
  const fallos = [];

  // 1) neoxr — la que usa el bot de WhatsApp para el mp3
  try {
    const datos = await neoxr("/youtube", { url, type: "audio", quality: CALIDAD_AUDIO });
    const enlace =
      buscarEnlace(datos, ["dl_download", "url", "download", "download_url", "dl", "audio", "audio_url", "link", "file"]) ||
      buscarEnlaceProfundo(datos, /\.(mp3|m4a|webm|opus|ogg)(\?|#|$)/i);

    if (enlace) {
      return {
        titulo: datos.title || datos?.data?.title || "YouTube",
        miniatura: datos.thumbnail || datos.thumb || "",
        autor: datos.channel || datos.author || "",
        url: urlCompleta(enlace)
      };
    }
    fallos.push("neoxr no devolvió enlace");
  } catch (e) {
    fallos.push(`neoxr: ${e.message}`);
  }

  // 2) API principal (esta quiere "format", igual que en el bot de WhatsApp;
  //    se manda también "quality" por si acaso)
  try {
    const r = await apiPost("/youtube/resolve", { url, type: "audio", format: "mp3", quality: CALIDAD_AUDIO });
    const media = r.media || r;
    const enlace = media.dl_download || media.direct || buscarEnlaceProfundo(r, /\.(mp3|m4a|webm|opus|ogg)(\?|#|$)/i);
    if (enlace) {
      return {
        titulo: r.title || "YouTube",
        miniatura: r.thumbnail || "",
        autor: r.channel || r.author || "",
        url: urlCompleta(enlace)
      };
    }
    fallos.push("la API principal no devolvió enlace");
  } catch (e) {
    fallos.push(`api: ${e.message}`);
  }

  throw new Error(`Ninguna API me dio el audio (${fallos.join(" | ")})`);
}

/**
 * Video de YouTube.
 *
 * Igual que el bot de WhatsApp: POST /youtube/resolve con
 * { url, type: "video", quality } y el enlace sale de result.media.dl_download
 * (o .direct). La calidad va SIN la "p" ("360", "720", "4k"); con "360p" la API
 * responde "Calidad inválida".
 */
export async function videoYoutube(url, calidad = CALIDAD_POR_DEFECTO) {
  const limpia = normalizarCalidad(calidad);
  const fallos = [];

  // 1) API principal
  try {
    const r = await apiPost("/youtube/resolve", { url, type: "video", quality: limpia });
    const media = r.media || r;
    const enlace = media.dl_download || media.direct || buscarEnlaceProfundo(r, /\.(mp4|mkv|webm)(\?|#|$)/i);
    if (enlace) {
      return {
        titulo: r.title || "YouTube",
        miniatura: r.thumbnail || "",
        url: urlCompleta(enlace),
        calidad: limpia
      };
    }
    fallos.push("la API principal no devolvió enlace");
  } catch (e) {
    fallos.push(`api: ${e.message}`);
  }

  // 2) neoxr de respaldo (esta sí quiere la "p")
  try {
    const datos = await neoxr("/youtube", { url, type: "video", quality: limpia === "4k" ? "2160p" : `${limpia}p` });
    const enlace =
      buscarEnlace(datos, ["dl_download", "url", "download", "download_url", "dl", "video", "link", "file"]) ||
      buscarEnlaceProfundo(datos, /\.(mp4|mkv|webm)(\?|#|$)/i);
    if (enlace) {
      return {
        titulo: datos.title || "YouTube",
        miniatura: datos.thumbnail || "",
        url: urlCompleta(enlace),
        calidad: limpia
      };
    }
    fallos.push("neoxr no devolvió enlace");
  } catch (e) {
    fallos.push(`neoxr: ${e.message}`);
  }

  throw new Error(`Ninguna API me dio el video (${fallos.join(" | ")})`);
}

/** Deja la calidad como la quiere la API: "720p" → "720", "2160" → "4k" */
export function normalizarCalidad(calidad) {
  const t = String(calidad || "").toLowerCase().trim();
  if (/4k|2160/.test(t)) return "4k";
  const n = t.replace(/p$/i, "");
  return CALIDADES_VIDEO.includes(n) ? n : CALIDAD_POR_DEFECTO;
}

/* ─────────────────────── Otras redes ─────────────────────── */

export async function descargarTiktok(url) {
  const r = await apiPost("/tiktok", { url });
  const media = r.media || r;
  return {
    titulo: r.title || "TikTok",
    autor: r.author?.nickname || r.author?.name || r.author || "",
    duracion: r.duration || 0,
    video: urlCompleta(
      media.video || media.video_hd || media.play || media.nowatermark || media.hd || media.sd || buscarEnlace(media)
    ),
    audio: urlCompleta(media.audio || media.music || ""),
    portada: urlCompleta(media.cover || r.thumbnail || ""),
    imagenes: media.images || r.images || []
  };
}

/**
 * Facebook.
 *
 * La API devuelve el video en `result.media.video_hd` y `result.media.video_sd`
 * (así lo leía el bot de WhatsApp). Antes aquí solo se buscaba `hd`/`sd`/`video`
 * y por eso siempre salía "No encontré el video en ese enlace".
 */
export async function descargarFacebook(url) {
  const r = await apiPost("/facebook", { url });
  const media = r.media || r;

  const directo =
    media.video_hd || media.video_sd ||
    media.hd || media.sd ||
    media.video || media.url ||
    buscarEnlace(r, ["video_hd", "video_sd", "hd", "sd", "video", "dl_download", "download", "url", "link"]);

  if (!directo) throw new Error("La API no devolvió ningún video (puede ser privado o un reel protegido)");

  // La API tiene un endpoint propio que sirve el archivo ya listo
  const porProxy = `${API_BASE}/facebook/dl?type=video&src=${encodeURIComponent(directo)}&filename=${encodeURIComponent("video.mp4")}&download=1`;

  return {
    titulo: r.title || "Facebook",
    miniatura: urlCompleta(r.thumbnail || r.image || ""),
    video: porProxy,
    directo: urlCompleta(directo)
  };
}

/* ─────────────────────── Instagram ─────────────────────── */

const RE_URL = /^https?:\/\//i;

/** Descarta enlaces que no son el archivo (perfil, la propia publicación...) */
function enlaceInutil(url = "", clave = "") {
  const u = String(url);
  const k = String(clave).toLowerCase();
  if (!RE_URL.test(u)) return true;
  if (/instagram\.com\/(p|reel|tv|stories)\//i.test(u)) return true;
  return ["profile", "avatar", "owner", "user_pic", "profile_pic"].some((x) => k.includes(x));
}

const esMiniatura = (clave = "") =>
  ["thumb", "thumbnail", "cover"].some((x) => String(clave).toLowerCase().includes(x));

/** Adivina si un enlace es video o imagen */
function tipoDeMedia(url = "", mime = "", clave = "") {
  const u = String(url).toLowerCase();
  const m = String(mime).toLowerCase();
  const k = String(clave).toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("image/")) return "imagen";
  if (k.includes("video")) return "video";
  if (k.includes("image") || k.includes("photo") || k.includes("display")) return "imagen";
  if (/\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(u)) return "video";
  if (/\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(u)) return "imagen";
  return "video";
}

/**
 * Recorre toda la respuesta de la API y saca los archivos.
 * Es el mismo recorrido que hacía el bot de WhatsApp: las APIs de Instagram
 * devuelven el JSON con formas muy distintas según el tipo de publicación.
 */
export function extraerMediosInstagram(datos, maximo = 10) {
  const encontrados = [];

  const recorrer = (valor, clave = "", hondura = 0) => {
    if (hondura > 7 || valor == null) return;

    if (typeof valor === "string") {
      if (RE_URL.test(valor) && !enlaceInutil(valor, clave)) {
        encontrados.push({ url: valor, tipo: tipoDeMedia(valor, "", clave), miniatura: esMiniatura(clave) });
      }
      return;
    }

    if (Array.isArray(valor)) {
      for (const item of valor) recorrer(item, clave, hondura + 1);
      return;
    }

    if (typeof valor !== "object") return;

    const posible =
      valor.url || valor.dl || valor.link || valor.download || valor.downloadUrl ||
      valor.download_url || valor.media || valor.src || valor.video || valor.image ||
      valor.display_url || "";

    if (typeof posible === "string" && !enlaceInutil(posible, clave)) {
      const bruto = String(valor.type || valor.media_type || valor.mime || valor.mimetype || "").toLowerCase();
      let tipo = "";
      if (bruto.includes("video") || bruto.includes("mp4")) tipo = "video";
      else if (bruto.includes("image") || bruto.includes("photo") || bruto.includes("jpg") || bruto.includes("png")) tipo = "imagen";
      encontrados.push({
        url: posible,
        tipo: tipo || tipoDeMedia(posible, valor.mime || valor.mimetype || "", clave),
        miniatura: esMiniatura(clave)
      });
    }

    for (const [k, v] of Object.entries(valor)) recorrer(v, k, hondura + 1);
  };

  recorrer(datos);

  const vistos = new Set();
  const unicos = encontrados.filter((x) => x.url && !vistos.has(x.url) && vistos.add(x.url));
  const sinMiniaturas = unicos.filter((x) => !x.miniatura);

  return (sinMiniaturas.length ? sinMiniaturas : unicos).slice(0, maximo);
}

/**
 * Instagram. La API de respaldo (neoxr /ig) es la que usaba el bot de WhatsApp
 * y la que mejor responde, así que va primero; la principal queda de reserva.
 */
export async function descargarInstagram(url) {
  const intentos = [
    () => neoxr("/ig", { url }),
    () => apiPost("/instagram", { url })
  ];

  let fallo = null;
  for (const intentar of intentos) {
    try {
      const datos = await intentar();
      const medios = extraerMediosInstagram(datos);
      if (medios.length) return medios;
      fallo = new Error("La API respondió pero sin archivos");
    } catch (e) {
      fallo = e;
    }
  }

  throw fallo || new Error("No encontré nada en ese enlace");
}

export async function descargarTwitter(url) {
  const r = await apiPost("/twitter", { url });
  const media = r.media || r;
  return {
    titulo: r.title || r.description || "Twitter / X",
    video: urlCompleta(media.video_hd || media.video_sd || media.hd || media.sd || media.video || media.url || ""),
    imagen: urlCompleta(media.image || media.thumbnail || "")
  };
}

export async function descargarSpotify(url) {
  const r = await apiPost("/spotify", { url });
  return {
    titulo: r.title || r.name || "Spotify",
    artista: r.artist || r.artists || "",
    miniatura: r.thumbnail || r.image || "",
    audio: urlCompleta(buscarEnlace(r, ["url", "download", "audio", "dl_download", "link"]))
  };
}

export default {
  API_BASE, API_KEY, NEOXR_BASE, NEOXR_KEY, MAX_SUBIDA,
  apiGet, apiPost, neoxr, urlCompleta, descargarBuffer, buscarEnlace,
  buscarYoutube, audioYoutube, videoYoutube,
  descargarTiktok, descargarFacebook, descargarInstagram, descargarTwitter, descargarSpotify
};
