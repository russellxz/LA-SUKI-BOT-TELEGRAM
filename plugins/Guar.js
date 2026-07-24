// plugins/Guar.js — Guardar multimedia con una palabra clave
//
// Responde a una foto, video, audio, sticker o documento con:
//    .guar hola
// Después, cuando alguien escriba "hola", el bot manda ese archivo.
//
// Se guarda el file_id de Telegram (reenvío instantáneo) y, si el archivo es
// pequeño, también una copia en disco por si algún día se cambia de token.
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MEDIA_ROOT = path.resolve("./guar_media");
const FILES_DB = path.resolve("./guar_files.json");
const MAX_COPIA = 10 * 1024 * 1024; // 10 MB

/** Convierte la palabra clave en un nombre de carpeta seguro */
function carpetaSegura(clave) {
  return (
    String(clave)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 64) || "default"
  );
}

function leerDB() {
  try {
    if (fs.existsSync(FILES_DB)) return JSON.parse(fs.readFileSync(FILES_DB, "utf-8") || "{}");
  } catch {}
  return {};
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "⏳");

  // El multimedia puede venir citado o en el mismo mensaje con caption
  const media = msg.quoted?.media || (msg.media && msg.tipo !== "texto" ? msg.media : null);
  const textoCitado = !media ? msg.quoted?.text : null;

  if (!media && !textoCitado) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text:
        "❌ *Responde a un archivo* (foto, video, audio, sticker o documento) con\n" +
        `*${usedPrefix}${command} <palabra clave>* para guardarlo.\n\n` +
        `*Ejemplo:* responde a un audio con *${usedPrefix}${command} hola*\n` +
        "_Después, cuando alguien escriba \"hola\", yo mando ese audio._"
    }, { quoted: msg });
  }

  const clave = String(text || "").trim().toLowerCase();

  if (!clave || !/[a-z0-9áéíóúñ]/i.test(clave)) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: "❌ *Debes indicar una palabra clave* (con letras o números).\n\n" +
        `*Ejemplo:* ${usedPrefix}${command} buenos dias`
    }, { quoted: msg });
  }

  // No se permite guardar comandos ni palabras con prefijo
  if (clave === "guar" || global.prefixes.some((p) => clave.startsWith(p))) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: `🚫 *Bloqueado:* no puedes guardar *"${clave}"* como palabra clave.`
    }, { quoted: msg });
  }
  if (global.pluginIndex?.has(clave)) {
    await conn.react(chatId, msg.message_id, "❌");
    return conn.sendMessage(chatId, {
      text: `🚫 *"${clave}" ya es un comando del bot.* Elige otra palabra.`
    }, { quoted: msg });
  }

  const entrada = {
    tipo: media?.tipo || "texto",
    fileId: media?.fileId || null,
    uniqueId: media?.uniqueId || null,
    mime: media?.mime || null,
    ext: media?.ext || null,
    fileName: media?.fileName || null,
    caption: msg.quoted?.text || null,
    texto: textoCitado || null,
    user: msg.senderId,
    creado: Date.now()
  };

  // Copia local de respaldo para archivos chicos
  if (media?.fileId && (media.size || 0) <= MAX_COPIA) {
    try {
      const buffer = await conn.downloadMedia(media.fileId);
      const carpeta = path.join(MEDIA_ROOT, carpetaSegura(clave));
      fs.mkdirSync(carpeta, { recursive: true });
      const nombre = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}.${media.ext || "bin"}`;
      const destino = path.join(carpeta, nombre);
      fs.writeFileSync(destino, buffer);
      entrada.path = path.relative(process.cwd(), destino).split(path.sep).join("/");
      entrada.size = buffer.length;
    } catch (e) {
      console.log("⚠️ guar: no pude guardar la copia local:", e.message);
    }
  }

  const db = leerDB();
  if (!Array.isArray(db[clave])) db[clave] = [];
  db[clave].push(entrada);
  fs.writeFileSync(FILES_DB, JSON.stringify(db, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `✅ *Guardado en el paquete "${clave}".*\n\n` +
      `📦 Tipo: *${entrada.tipo}*\n` +
      `🔢 Archivos en el paquete: *${db[clave].length}*\n\n` +
      `_Escribe *${clave}* en el chat y te lo mando._`
  }, { quoted: msg });
};

handler.command = ["guar", "guar2", "guardar"];
export default handler;
