/**
 * libs/fuctions.js — Conversión de multimedia para stickers de Telegram.
 *
 * Reglas de Telegram (por eso los tamaños son distintos a los de WhatsApp):
 *   • Sticker estático  → WEBP, un lado exacto de 512px, máx 512 KB
 *   • Sticker animado   → WEBM (VP9), máx 512x512, máx 3 segundos, máx 256 KB
 *
 * Se usa ffmpeg cuando está disponible y sharp como respaldo para imágenes,
 * así el bot sigue haciendo stickers aunque el hosting no traiga ffmpeg.
 */

import fs from "fs";
import path from "path";
import Crypto from "crypto";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const tempFolder = path.join(__dirname, "../tmp/");

if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

const tmpFile = (ext) =>
  path.join(tempFolder, `${Date.now()}_${Crypto.randomBytes(4).toString("hex")}.${ext}`);

let ffmpegDisponible = null;

/** ¿Hay ffmpeg instalado en el sistema? (se comprueba una sola vez) */
export function hayFfmpeg() {
  if (ffmpegDisponible !== null) return ffmpegDisponible;
  try {
    const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    ffmpegDisponible = !r.error && r.status === 0;
  } catch {
    ffmpegDisponible = false;
  }
  if (!ffmpegDisponible) {
    console.log("⚠️  ffmpeg no está instalado: los stickers animados, audios y conversiones de video no funcionarán.");
  }
  return ffmpegDisponible;
}

/**
 * Ejecuta ffmpeg sobre un buffer y devuelve el resultado como buffer.
 * @param {Buffer} buffer     archivo de entrada
 * @param {string[]} args     argumentos de salida (filtros, códecs...)
 * @param {string} extEntrada extensión del archivo de entrada
 * @param {string} extSalida  extensión del resultado
 * @param {string[]} previos  argumentos que van ANTES del -i (ej: ["-loop","1"])
 */
export function ffmpeg(buffer, args = [], extEntrada = "bin", extSalida = "mp4", previos = []) {
  return new Promise((resolve, reject) => {
    const entrada = tmpFile(extEntrada);
    const salida = `${entrada}.${extSalida}`;
    try {
      fs.writeFileSync(entrada, buffer);
    } catch (e) {
      return reject(e);
    }

    const proc = spawn("ffmpeg", ["-y", ...previos, "-i", entrada, ...args, salida]);
    let error = "";
    proc.stderr.on("data", (d) => { error += d.toString(); });

    proc.on("error", (e) => {
      fs.unlink(entrada, () => {});
      reject(e);
    });

    proc.on("close", (code) => {
      fs.unlink(entrada, () => {});
      if (code !== 0 || !fs.existsSync(salida)) {
        return reject(new Error(`ffmpeg salió con código ${code}: ${error.slice(-400)}`));
      }
      try {
        const out = fs.readFileSync(salida);
        fs.unlink(salida, () => {});
        resolve(out);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/** Imagen → WEBP 512x512 listo para sticker de Telegram */
export async function imageToWebp(media) {
  try {
    const { default: sharp } = await import("sharp");
    return await sharp(media, { animated: false })
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toBuffer();
  } catch (e) {
    // Respaldo con ffmpeg si sharp no está disponible
    return ffmpeg(
      media,
      [
        "-vcodec", "libwebp",
        "-vf",
        "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000"
      ],
      "jpg",
      "webp"
    );
  }
}

/** Tamaño máximo que acepta Telegram para un sticker animado */
export const MAX_STICKER_WEBM = 256 * 1024;

/** Segundos máximos que Telegram acepta en un sticker animado */
const TOPE_SEGUNDOS = 2.9;

/**
 * Duración del video en segundos (lo saca del informe de ffmpeg).
 * Si no se puede averiguar, devuelve el tope, que es el caso más exigente.
 */
function duracionDe(buffer, extEntrada) {
  const entrada = tmpFile(extEntrada);
  try {
    fs.writeFileSync(entrada, buffer);
    // ffmpeg sin salida termina con error, pero antes imprime la duración
    const r = spawnSync("ffmpeg", ["-hide_banner", "-i", entrada], { encoding: "utf8" });
    const texto = `${r.stderr || ""}${r.stdout || ""}`;
    const m = texto.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (!m) return TOPE_SEGUNDOS;
    const segundos = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    return Math.min(segundos || TOPE_SEGUNDOS, TOPE_SEGUNDOS);
  } catch {
    return TOPE_SEGUNDOS;
  } finally {
    fs.unlink(entrada, () => {});
  }
}

/**
 * Arma los argumentos de ffmpeg para un intento de conversión.
 *
 * Telegram exige que el lado más largo mida exactamente 512px, por eso se
 * escala siempre a 512 (aunque el video venga más chico) y no solo "hasta" 512:
 * si ningún lado llega a 512 el sticker se ve borroso o directamente en blanco.
 *
 * @param {object} ajuste  { crf, fps, bitrate, filtro }  bitrate en kbps (0 = solo CRF)
 */
function argsWebm({ crf, fps, bitrate = 0, filtro = "" }) {
  // Con bitrate se usa VBR puro (sin -crf): así el control de tasa manda y el
  // archivo entra en el peso. Con -crf el codificador se niega a bajar de esa
  // calidad y se pasa del límite.
  const control = bitrate
    ? ["-b:v", `${bitrate}k`, "-maxrate", `${Math.round(bitrate * 1.3)}k`, "-bufsize", `${bitrate * 2}k`,
       "-qmin", "0", "-qmax", "63"]
    : ["-b:v", "0", "-crf", String(crf)];   // calidad constante: manda el CRF

  const cadena = [
    filtro,
    `fps=${fps}`,
    "scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos",
    "format=yuva420p"
  ].filter(Boolean).join(",");

  return [
    "-t", String(TOPE_SEGUNDOS),       // Telegram corta en 3 segundos
    "-an", "-sn", "-dn",               // sin audio, subtítulos ni datos
    "-c:v", "libvpx-vp9",
    ...control,
    "-vf", cadena,
    "-pix_fmt", "yuva420p",
    "-deadline", "good",
    "-cpu-used", "4",
    "-row-mt", "1",
    "-auto-alt-ref", "0",              // necesario para conservar transparencia
    "-f", "webm"
  ];
}

/**
 * Video / GIF / sticker animado → WEBM VP9 para sticker de Telegram.
 *
 * Antes se usaba una sola pasada muy comprimida (256 kbps con CRF 40) y por eso
 * los stickers de video salían borrosos. Ahora se empieza con buena calidad y,
 * si el archivo no entra en los 256 KB, se recalcula el bitrate a partir de la
 * duración real del clip para que quepa sin destrozar la imagen.
 *
 * @param {Buffer} media
 * @param {string} extEntrada
 * @param {object} opciones  { filtro, previos }
 *   filtro  → cadena de filtros extra de ffmpeg (para .sks y sus efectos)
 *   previos → argumentos antes del -i (ej: ["-loop","1"] para animar una foto)
 */
export async function videoToWebm(media, extEntrada = "mp4", opciones = {}) {
  const { filtro = "", previos = [] } = opciones;
  const segundos = previos.includes("-loop") ? TOPE_SEGUNDOS : duracionDe(media, extEntrada);

  /** kbps necesarios para que el archivo pese ~`kb` kilobytes */
  const bitratePara = (kb) => Math.max(120, Math.round((kb * 8) / segundos));

  const intentos = [
    { crf: 30, fps: 30 },                                  // calidad constante
    { crf: 40, fps: 30, bitrate: bitratePara(230) },        // ajustado al peso
    { crf: 50, fps: 20, bitrate: bitratePara(190) },        // último recurso
    { crf: 58, fps: 15, bitrate: bitratePara(150) }
  ];

  let ultimo = null;
  let fallo = null;

  for (const ajuste of intentos) {
    try {
      const salida = await ffmpeg(media, argsWebm({ ...ajuste, filtro }), extEntrada, "webm", previos);
      if (!salida?.length) continue;
      // Se guarda el más chico que se haya logrado, por si ninguno entra
      if (!ultimo || salida.length < ultimo.length) ultimo = salida;
      if (salida.length <= MAX_STICKER_WEBM) return salida;
    } catch (e) {
      fallo = e;
    }
  }

  if (ultimo) return ultimo;   // no bajó de 256 KB: que decida quien llama
  throw fallo || new Error("No pude convertir el video a sticker");
}

/** Alias histórico: en Telegram los animados van en WEBM */
export const videoToWebp = videoToWebm;

/** Sticker WEBP/WEBM → PNG (para .toimg) */
export async function webpToImage(media) {
  try {
    const { default: sharp } = await import("sharp");
    return await sharp(media, { animated: false }).png().toBuffer();
  } catch {
    return ffmpeg(media, ["-vframes", "1"], "webp", "png");
  }
}

/** Sticker animado → MP4 (para .tovideo) */
export async function webmToMp4(media, extEntrada = "webm") {
  return ffmpeg(
    media,
    ["-movflags", "faststart", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "26"],
    extEntrada,
    "mp4"
  );
}

/** Cualquier audio → MP3 */
export async function toAudio(buffer, ext = "mp3") {
  return ffmpeg(buffer, ["-vn", "-ac", "2", "-b:a", "128k", "-ar", "44100", "-f", "mp3"], ext, "mp3");
}

/** Cualquier audio → nota de voz OGG/Opus */
export async function toPTT(buffer, ext = "mp3") {
  return ffmpeg(
    buffer,
    ["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10", "-f", "ogg"],
    ext,
    "ogg"
  );
}

/** Cualquier video → MP4 compatible */
export async function toVideo(buffer, ext = "mp4") {
  return ffmpeg(
    buffer,
    ["-c:v", "libx264", "-c:a", "aac", "-ab", "128k", "-ar", "44100", "-crf", "30", "-preset", "fast", "-pix_fmt", "yuv420p"],
    ext,
    "mp4"
  );
}

/**
 * Compatibilidad: en WhatsApp estas funciones escribían los metadatos (pack y
 * autor) dentro del WEBP. Telegram no usa ese formato — los packs se manejan
 * con la API de stickers — así que solo devuelven el sticker convertido.
 */
export async function writeExifImg(media) {
  return imageToWebp(media);
}

export async function writeExifVid(media) {
  return videoToWebm(media);
}

export async function writeExif(media, esVideo = false) {
  return esVideo ? videoToWebm(media) : imageToWebp(media);
}

export default {
  ffmpeg,
  hayFfmpeg,
  imageToWebp,
  videoToWebm,
  videoToWebp,
  webpToImage,
  webmToMp4,
  toAudio,
  toPTT,
  toVideo,
  writeExifImg,
  writeExifVid,
  writeExif
};
