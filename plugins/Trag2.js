// plugins/Trag2.js — Migrar un guar.json con OTRO formato (de otro bot)
//
// Es el hermano de .trag, pero para el formato plano que usan otros bots:
//
//   {
//     "palabra_clave": {
//       "buffer":    "<base64>",
//       "mimetype":  "image/jpeg",
//       "extension": "jpg",
//       "savedBy":   "521234567890@s.whatsapp.net"
//     }
//   }
//
// Deja los archivos en ./guar_media/<palabra>/ y las entradas en
// ./guar_files.json, que es lo que lee el sistema de .guar del bot.
//
// Uso:
//   .trag2 <cantidad>   → migra N palabras
//   .trag2 all          → migra todas

import fs from "fs";
import path from "path";
import crypto from "crypto";

const RUTA_VIEJA = path.resolve("./guar2.json");
const RUTA_NUEVA = path.resolve("./guar_files.json");
const MEDIA_ROOT = path.resolve("./guar_media");

/** Extensión a partir del tipo de archivo */
function extDeMime(mime, respaldo = "bin") {
  if (!mime || typeof mime !== "string") return respaldo;
  const sub = mime.split(";")[0].split("/")[1];
  if (!sub) return respaldo;
  if (sub.includes("mpeg")) return "mp3";
  if (sub.includes("webp")) return "webp";
  if (sub.includes("quicktime")) return "mov";
  if (sub.includes("x-msvideo")) return "avi";
  if (sub.includes("x-matroska")) return "mkv";
  return sub.replace(/^x-/, "") || respaldo;
}

/** Tipo interno del bot a partir del mime */
function tipoDeMime(mime = "") {
  const m = String(mime).toLowerCase();
  if (m.startsWith("image/")) return m.includes("webp") ? "sticker" : "imagen";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  return "documento";
}

/** Nombre de carpeta seguro para la palabra clave */
function claveSegura(clave) {
  return String(clave)
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64) || "default";
}

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const pref = usedPrefix || global.prefixes?.[0] || ".";

  if (!global.isOwner(msg.senderId)) {
    return conn.sendMessage(chatId, {
      text: "🚫 Solo el dueño del bot puede migrar la base de datos."
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "🔄");

  const pedido = String(args?.[0] || "").toLowerCase();
  const todos = pedido === "all" || pedido === "todo" || pedido === "todos";
  const cantidad = todos ? Infinity : parseInt(pedido, 10);

  if (!todos && (isNaN(cantidad) || cantidad < 1)) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text:
        `❗ Uso: *${pref}${command} <cantidad>*\n\n` +
        `*Ejemplos:*\n` +
        `• ${pref}${command} 1 → migra 1 palabra\n` +
        `• ${pref}${command} 10 → migra las primeras 10\n` +
        `• ${pref}${command} all → migra todas\n\n` +
        "_Sube el archivo del otro bot como *guar2.json* en la carpeta del bot._"
    }, { quoted: msg });
  }

  if (!fs.existsSync(RUTA_VIEJA)) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: "⚠️ No existe *guar2.json*, no hay nada que migrar.\n\n_Sube ahí el archivo del otro bot._"
    }, { quoted: msg });
  }

  let vieja;
  try {
    vieja = JSON.parse(fs.readFileSync(RUTA_VIEJA, "utf-8"));
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: `❌ No pude leer *guar2.json*.\n\n_${String(e.message).slice(0, 150)}_`
    }, { quoted: msg });
  }

  const claves = Object.keys(vieja || {});
  if (!claves.length) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, { text: "📭 El archivo *guar2.json* está vacío." }, { quoted: msg });
  }

  const aMigrar = todos ? claves : claves.slice(0, cantidad);

  let nueva = {};
  if (fs.existsSync(RUTA_NUEVA)) {
    try { nueva = JSON.parse(fs.readFileSync(RUTA_NUEVA, "utf-8")); } catch { nueva = {}; }
  }
  if (!fs.existsSync(MEDIA_ROOT)) fs.mkdirSync(MEDIA_ROOT, { recursive: true });

  let migradas = 0;
  let errores = 0;
  const detalles = [];

  for (const clave of aMigrar) {
    try {
      const item = vieja[clave];
      const base64 = item?.buffer || item?.media || item?.data;
      if (!base64) { errores++; continue; }

      const buf = Buffer.from(base64, "base64");
      if (!buf.length) { errores++; continue; }

      const mime = item.mimetype || item.mime || "application/octet-stream";
      const ext = item.extension || item.ext || extDeMime(mime);

      const carpeta = path.join(MEDIA_ROOT, claveSegura(clave));
      if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

      const sello = Date.now() + Math.floor(Math.random() * 1000);
      const nombre = `${sello}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const ruta = path.join(carpeta, nombre);
      fs.writeFileSync(ruta, buf);

      const relativa = path.relative(process.cwd(), ruta).split(path.sep).join("/");

      if (!Array.isArray(nueva[clave])) nueva[clave] = [];
      nueva[clave].push({
        tipo: tipoDeMime(mime),
        path: relativa,
        fileName: nombre,
        mime,
        ext,
        size: buf.length,
        user: String(item.savedBy || item.user || "").replace(/\D/g, ""),
        caption: item.caption || null,
        createdAt: sello,
        migratedFrom: "guar2.json"
      });

      delete vieja[clave];
      migradas++;
      detalles.push(`• ${clave} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.error(`[trag2] error en "${clave}":`, e.message);
      errores++;
    }
  }

  try {
    fs.writeFileSync(RUTA_NUEVA, JSON.stringify(nueva, null, 2));
    fs.writeFileSync(RUTA_VIEJA, JSON.stringify(vieja, null, 2));
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: `❌ Migré los archivos pero no pude guardar los índices.\n\n_${String(e.message).slice(0, 150)}_`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, migradas ? "✅" : "❌");
  await conn.sendMessage(chatId, {
    text:
      "📦 *Migración desde guar2.json*\n\n" +
      `✅ Palabras migradas: *${migradas}*\n` +
      (errores ? `⚠️ Con problemas: *${errores}*\n` : "") +
      `📭 Quedan por migrar: *${Object.keys(vieja).length}*\n\n` +
      (detalles.length ? `${detalles.slice(0, 15).join("\n")}${detalles.length > 15 ? `\n… y ${detalles.length - 15} más` : ""}\n\n` : "") +
      `_Míralas con_ *${pref}verpacks*`
  }, { quoted: msg });
};

handler.command = ["trag2", "migrarguar2"];
export default handler;
