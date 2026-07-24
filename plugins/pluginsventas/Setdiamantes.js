"use strict";

import fs from 'fs';
import path from 'path';

// ==== helpers comunes ====
const DIGITS = (s = "") => String(s).replace(/\D/g, "");
function unwrapMessage(m) {
  let node = m;
  while (
    node?.viewOnceMessage?.message ||
    node?.viewOnceMessageV2?.message ||
    node?.viewOnceMessageV2Extension?.message ||
    node?.ephemeralMessage?.message
  ) {
    node =
      node.viewOnceMessage?.message ||
      node.viewOnceMessageV2?.message ||
      node.viewOnceMessageV2Extension?.message ||
      node.ephemeralMessage?.message;
  }
  return node;
}
function getQuotedImageMessage(msg) {
  return msg.quoted?.media?.tipo === "imagen" ? msg.quoted.media
    : msg.media?.tipo === "imagen" ? msg.media
    : null;
}
const DB_PATH = path.resolve("./ventas365.json");
function loadJsonSafe() {
  try { return fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) : {}; }
  catch { return {}; }
}
function saveJsonAtomic(obj) {
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const handler = async (msg, { conn, args, text, wa }) => {
  const chatId    = msg.chatId;
  const isGroup   = msg.isGroup;
  const senderJid = msg.senderId;
  const senderNum = DIGITS(senderJid);
  const isFromMe  = !!false;

  if (!isGroup)
    return conn.sendMessage(chatId, { text: "❌ Este comando solo funciona en grupos." }, { quoted: msg });

  const isAdmin = await conn.esAdmin(chatId, msg.senderId);
  const owners  = Array.isArray(global.owner) ? global.owner : [];
  const isOwner = owners.some(([id]) => id === senderNum);
  if (!isAdmin && !isOwner && !isFromMe)
    return conn.sendMessage(chatId, { text: "🚫 Este comando solo puede ser usado por administradores." }, { quoted: msg });

  const textoArg   = typeof text === "string" ? text : (Array.isArray(args) ? args.join(" ") : "");
  const textoCrudo = textoArg;
  const quotedText = !textoCrudo ? (msg.quoted?.text || null) : null;
  const quotedImage = getQuotedImageMessage(msg);

  if (!textoCrudo && !quotedText && !quotedImage) {
    return conn.sendMessage(
      chatId,
      { text: "✏️ Usa: *setdiamantes <texto>* (multilínea) o responde a una *imagen* con: *setdiamantes <texto>*" },
      { quoted: msg }
    );
  }

  let imagenBase64 = null;
  if (quotedImage) {
    imagenBase64 = quotedImage.fileId;
  }

  const db = loadJsonSafe();
  if (!db[chatId]) db[chatId] = {};
  db[chatId]["setdiamantes"] = { texto: (textoCrudo || quotedText || ""), imagen: imagenBase64 };
  saveJsonAtomic(db);

  await conn.sendMessage(chatId, { text: "✅ *DIAMANTES actualizado con éxito.*" }, { quoted: msg });
};

handler.command = ["setdiamantes"];
export default handler;
