// plugins/settramites.js
import fs from 'fs';
import path from 'path';

const DIGITS = (s = "") => String(s).replace(/\D/g, "");

/** Admin por NÚMERO real (funciona en LID y no-LID) */

/** Desencapsula viewOnce/ephemeral y retorna el nodo interno */
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

/** Extrae texto del mensaje citado (preserva saltos/espacios) */

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

  // Permisos: admin / owner / bot
  const isAdmin = await conn.esAdmin(chatId, msg.senderId);
  const owners  = Array.isArray(global.owner) ? global.owner : [];
  const isOwner = owners.some(([id]) => id === senderNum);

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, { text: "🚫 Este comando solo puede ser usado por administradores." }, { quoted: msg });
  }

  // ——— Texto crudo (NO trim; preserva \n y espacios) ———
  const textoArg   = typeof text === "string" ? text : (Array.isArray(args) ? args.join(" ") : "");
  const textoCrudo = textoArg;

  // Texto del citado si no escribieron nada
  const quotedText  = !textoCrudo ? (msg.quoted?.text || null) : null;

  // ¿Imagen citada? (viewOnce/ephemeral soportado)
  const quotedImage = getQuotedImageMessage(msg);

  if (!textoCrudo && !quotedText && !quotedImage) {
    return conn.sendMessage(
      chatId,
      { text: "📄 Usa el comando así:\n\n• *settramites <texto>* (multilínea permitido)\n• O responde a una *imagen* con: *settramites <texto>*" },
      { quoted: msg }
    );
  }

  // Descargar imagen si fue citada
  let imagenBase64 = null;
  if (quotedImage) {
    try {
      imagenBase64 = quotedImage.fileId;
    } catch (e) {
      console.error("[settramites] error leyendo imagen citada:", e);
    }
  }

  const textoFinal = (textoCrudo || quotedText || "");

  // Guardar EXACTO
  const filePath = "./ventas365.json";
  let data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
  if (!data[chatId]) data[chatId] = {};
  data[chatId]["settramites"] = {
    texto: textoFinal,   // 👈 se guarda tal cual, con saltos/espacios
    imagen: imagenBase64 // null si no hay
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  await conn.sendMessage(chatId, { text: "✅ *TRÁMITES configurados correctamente.*" }, { quoted: msg });
};

handler.command = ["settramites"];
export default handler;
