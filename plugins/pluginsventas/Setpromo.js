import fs from 'fs';
import path from 'path';

const DIGITS = (s = "") => String(s).replace(/\D/g, "");

/** Admin por NÚMERO real (funciona en LID y no-LID) */

/** Desencapsula viewOnce/ephemeral y retorna el mensaje interno real */
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

const handler = async (msg, { conn, args, text, wa }) => {
  const chatId    = msg.chatId;
  const isGroup   = msg.isGroup;
  const senderJid = msg.senderId;
  const senderNum = DIGITS(senderJid);
  const isFromMe  = !!false;

  if (!isGroup) {
    return conn.sendMessage(chatId, { text: "❌ Este comando solo funciona en grupos." }, { quoted: msg });
  }

  // Permisos: admin / owner / bot (LID-aware)
  const isAdmin = await conn.esAdmin(chatId, msg.senderId);
  const isOwner = Array.isArray(global.owner) && global.owner.some(([id]) => id === senderNum);

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, { text: "🚫 Este comando solo puede ser usado por administradores." }, { quoted: msg });
  }

  // ——— Texto crudo (preserva saltos/espacios) ———
  const textoArg = typeof text === "string" ? text : (Array.isArray(args) ? args.join(" ") : "");
  const textoCrudo = textoArg.startsWith(" ") ? textoArg.slice(1) : textoArg;

  // Texto del citado si no escribieron nada
  const quotedText = !textoCrudo ? (() => {
    const q = msg.quoted?.raw;
    if (!q) return null;
    const inner = unwrapMessage(q);
    return (
      inner?.conversation ||
      inner?.extendedTextMessage?.text ||
      null
    );
  })() : null;

  // Imagen citada (con soporte a wrappers)
  const quotedImage = getQuotedImageMessage(msg);

  if (!textoCrudo && !quotedText && !quotedImage) {
    return conn.sendMessage(chatId, {
      text: `🎁 Usa el comando así:\n\n• *setpromo <texto>*  (multilínea permitido)\n• O responde a una *imagen* y escribe: *setpromo <texto>*`
    }, { quoted: msg });
  }

  // Descargar imagen si fue citada (con WA inyectado)
  let imagenBase64 = null;
  if (quotedImage) {
    try {
      imagenBase64 = quotedImage.fileId;
    } catch (e) {
      console.error("[setpromo] error leyendo imagen citada:", e);
    }
  }

  const textoFinal = (textoCrudo || quotedText || "");

  // Guardado
  const filePath = "./ventas365.json";
  let ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
  if (!ventas[chatId]) ventas[chatId] = {};

  ventas[chatId]["setpromo"] = {
    texto: textoFinal,     // EXACTO (con \n y espacios)
    imagen: imagenBase64   // base64 o null si no hay imagen
  };

  fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2));

  await conn.sendMessage(chatId, { text: "✅ *PROMO actualizada exitosamente.*" }, { quoted: msg });
};

handler.command = ["setpromo"];
export default handler;
