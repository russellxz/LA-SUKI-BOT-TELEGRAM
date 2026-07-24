import fs from 'fs';
import path from 'path';

const DIGITS = (s = "") => String(s).replace(/\D/g, "");

/** Admin por NÚMERO real (funciona en LID y no-LID) */

/** Extrae texto de un mensaje citado (manteniendo saltos/espacios) */

/** Desencapsula viewOnce/ephemeral */
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

const handler = async (msg, { conn, text, args, wa }) => {
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
  const rawFromDispatcher = typeof text === "string" ? text : "";
  const textoCrudo = rawFromDispatcher.startsWith(" ") ? rawFromDispatcher.slice(1) : rawFromDispatcher;

  // Si no escribió texto, usamos el del mensaje citado (si existe).
  const quotedText = !textoCrudo ? (msg.quoted?.text || null) : null;

  // Imagen citada opcional (desencapsulada)
  const ctx  = msg.quoted;
  const qRaw = ctx?.quotedMessage;
  const inner = qRaw ? unwrapMessage(qRaw) : null;
  const quotedImage = (msg.quoted?.media?.tipo === "imagen" ? msg.quoted.media : (msg.media?.tipo === "imagen" ? msg.media : null));

  if (!textoCrudo && !quotedText && !quotedImage) {
    return conn.sendMessage(chatId, {
      text: `✏️ Usa el comando así:\n\n• *setpago <texto>*  (multilínea permitido)\n• O responde a una *imagen* y escribe: *setpago <texto>*`
    }, { quoted: msg });
  }

  // Asegurar wa

  // Cargar JSON primero para poder preservar imagen previa si no envían nueva
  const filePath = "./ventas365.json";
  let ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
  if (!ventas[chatId]) ventas[chatId] = {};
  const prev = ventas[chatId]["setpago"] || {};

  // Procesar imagen (si viene citada)
  let imagenBase64 = null;
  if (quotedImage) {
    try {
      imagenBase64 = quotedImage.fileId;
    } catch (e) {
      console.error("[setpago] error leyendo imagen citada:", e);
    }
  }

  const textoFinal = (textoCrudo || quotedText || "");

  // Guardar (conserva imagen previa si no hay nueva)
  ventas[chatId]["setpago"] = {
    texto: textoFinal,                       // EXACTO (con \n y espacios)
    imagen: imagenBase64 ?? prev.imagen ?? null
  };

  fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2));

  await conn.sendMessage(chatId, { text: "✅ *DATOS DE PAGO actualizados.*" }, { quoted: msg });
};

handler.command = ["setpago"];
export default handler;
