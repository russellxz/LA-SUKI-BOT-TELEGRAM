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
import { spawn } from "child_process";
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
    const r = spawn("ffmpeg", ["-version"]);
    ffmpegDisponible = true;
    r.on("error", () => { ffmpegDisponible = false; });
    r.kill();
  } catch {
    ffmpegDisponible = false;
  }
  return ffmpegDisponible;
}

/** Ejecuta ffmpeg sobre un buffer y devuelve el resultado como buffer */
export function ffmpeg(buffer, args = [], extEntrada = "bin", extSalida = "mp4") {
  return new Promise((resolve, reject) => {
    const entrada = tmpFile(extEntrada);
    const salida = `${entrada}.${extSalida}`;
    try {
      fs.writeFileSync(entrada, buffer);
    } catch (e) {
      return reject(e);
    }

    const proc = spawn("ffmpeg", ["-y", "-i", entrada, ...args, salida]);
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

/** Video/GIF → WEBM VP9 para sticker animado de Telegram (máx 3s) */
export async function videoToWebm(media, extEntrada = "mp4") {
  return ffmpeg(
    media,
    [
      "-t", "2.9",
      "-an",
      "-c:v", "libvpx-vp9",
      "-b:v", "256k",
      "-crf", "40",
      "-vf", "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=30",
      "-pix_fmt", "yuva420p",
      "-f", "webm"
    ],
    extEntrada,
    "webm"
  );
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
