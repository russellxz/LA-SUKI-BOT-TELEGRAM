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

/** Extrae texto del mensaje citado (manteniendo saltos/espacios) */

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

  // Permisos: admin / owner / bot (compatibles con LID)
  const isAdmin = await conn.esAdmin(chatId, msg.senderId);
  const isOwner = Array.isArray(global.owner) && global.owner.some(([id]) => id === senderNum);

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, { text: "🚫 Solo administradores u owner pueden usar este comando." }, { quoted: msg });
  }

  // ——— Texto crudo (NO trim, respeta saltos/espacios) ———
  const textoArg  = typeof text === "string" ? text : (Array.isArray(args) ? args.join(" ") : "");
  const textoCrudo = textoArg; // no recortamos, preservamos \n y espacios

  // Texto del mensaje citado (si no escribieron nada tras el comando)
  const quotedText = !textoCrudo ? (msg.quoted?.text || null) : null;

  // ¿Imagen citada? (soporta viewOnce/ephemeral)
  const quotedImage = getQuotedImageMessage(msg);

  if (!textoCrudo && !quotedText && !quotedImage) {
    return conn.sendMessage(
      chatId,
      { text: "✏️ Usa el comando así:\n\n• *setcombos <texto>* (multilínea permitido)\n• O responde a una *imagen* con: *setcombos <texto>*" },
      { quoted: msg }
    );
  }

  // Descargar imagen si fue citada
  let imagenBase64 = null;
  if (quotedImage) {
    try {
      imagenBase64 = quotedImage.fileId;
    } catch (e) {
      console.error("[setcombos] error leyendo imagen citada:", e);
    }
  }

  const textoFinal = (textoCrudo || quotedText || "");

  // Guardar EXACTO
  const filePath = "./ventas365.json";
  let ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
  if (!ventas[chatId]) ventas[chatId] = {};
  ventas[chatId]["setcombos"] = {
    texto: textoFinal,   // se guarda tal cual, con \n y espacios
    imagen: imagenBase64 // null si no hay imagen
  };

  fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2));

  await conn.sendMessage(chatId, { text: "✅ *COMBOS actualizado con éxito.*" }, { quoted: msg });
};

handler.command = ["setcombos"];
export default handler;
