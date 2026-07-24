/**
 * lib/mensajes.js — Normaliza los mensajes que llegan de Telegram.
 *
 * Cada plugin recibe un `msg` con todo masticado:
 *   msg.chatId        → ID del chat (número)
 *   msg.isGroup       → true en grupos y supergrupos
 *   msg.senderId      → ID de quien escribió
 *   msg.senderName    → su nombre visible
 *   msg.text          → texto o caption
 *   msg.tipo          → texto | imagen | video | audio | nota | sticker | documento | gif ...
 *   msg.media         → { tipo, fileId, mime, fileName, size } o null
 *   msg.quoted        → mensaje citado normalizado (o null)
 *   msg.mencionados   → IDs mencionados con @ o por respuesta
 *   msg.key           → { id, remoteJid, participant, fromMe } (compatibilidad)
 */

import { idPorUsername, nombreDe, registrarUsuario } from "./usuarios.js";

/** Extrae el media de un mensaje de Telegram */
export function extraerMedia(m) {
  if (!m) return null;

  if (m.photo?.length) {
    const foto = m.photo[m.photo.length - 1];
    return { tipo: "imagen", fileId: foto.file_id, uniqueId: foto.file_unique_id, mime: "image/jpeg", size: foto.file_size, ext: "jpg" };
  }
  if (m.sticker) {
    return {
      tipo: "sticker",
      fileId: m.sticker.file_id,
      uniqueId: m.sticker.file_unique_id,
      mime: m.sticker.is_video ? "video/webm" : m.sticker.is_animated ? "application/x-tgsticker" : "image/webp",
      ext: m.sticker.is_video ? "webm" : m.sticker.is_animated ? "tgs" : "webp",
      animado: !!(m.sticker.is_video || m.sticker.is_animated),
      emoji: m.sticker.emoji,
      pack: m.sticker.set_name,
      size: m.sticker.file_size
    };
  }
  if (m.animation) {
    return { tipo: "gif", fileId: m.animation.file_id, uniqueId: m.animation.file_unique_id, mime: m.animation.mime_type || "video/mp4", ext: "mp4", fileName: m.animation.file_name, size: m.animation.file_size, duracion: m.animation.duration };
  }
  if (m.video) {
    return { tipo: "video", fileId: m.video.file_id, uniqueId: m.video.file_unique_id, mime: m.video.mime_type || "video/mp4", ext: "mp4", fileName: m.video.file_name, size: m.video.file_size, duracion: m.video.duration };
  }
  if (m.video_note) {
    return { tipo: "video", fileId: m.video_note.file_id, uniqueId: m.video_note.file_unique_id, mime: "video/mp4", ext: "mp4", size: m.video_note.file_size, duracion: m.video_note.duration, redondo: true };
  }
  if (m.voice) {
    return { tipo: "nota", fileId: m.voice.file_id, uniqueId: m.voice.file_unique_id, mime: m.voice.mime_type || "audio/ogg", ext: "ogg", size: m.voice.file_size, duracion: m.voice.duration };
  }
  if (m.audio) {
    return { tipo: "audio", fileId: m.audio.file_id, uniqueId: m.audio.file_unique_id, mime: m.audio.mime_type || "audio/mpeg", ext: (m.audio.file_name || "a.mp3").split(".").pop(), fileName: m.audio.file_name, titulo: m.audio.title, artista: m.audio.performer, size: m.audio.file_size, duracion: m.audio.duration };
  }
  if (m.document) {
    const nombre = m.document.file_name || "archivo";
    return { tipo: "documento", fileId: m.document.file_id, uniqueId: m.document.file_unique_id, mime: m.document.mime_type || "application/octet-stream", ext: nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "bin", fileName: nombre, size: m.document.file_size };
  }
  return null;
}

/** Normaliza el mensaje citado (respuesta) */
export function normalizarCitado(m) {
  if (!m) return null;
  const media = extraerMedia(m);
  return {
    raw: m,
    id: m.message_id,
    messageId: m.message_id,
    senderId: m.from?.id ? String(m.from.id) : null,
    senderName: m.from ? nombreDe(m.from) : null,
    senderUser: m.from?.username || null,
    esBot: !!m.from?.is_bot,
    text: m.text || m.caption || "",
    tipo: media?.tipo || (m.text ? "texto" : "otro"),
    media,
    fileId: media?.fileId || null,
    // compatibilidad con el código viejo
    key: { id: m.message_id, remoteJid: m.chat?.id, participant: m.from?.id }
  };
}

/** IDs mencionados en el mensaje (por @usuario, por mención directa o citando) */
export function extraerMenciones(m) {
  const ids = new Set();
  const entidades = [...(m.entities || []), ...(m.caption_entities || [])];
  const texto = m.text || m.caption || "";

  for (const ent of entidades) {
    if (ent.type === "text_mention" && ent.user) {
      registrarUsuario(ent.user);
      ids.add(String(ent.user.id));
    } else if (ent.type === "mention") {
      const username = texto.substr(ent.offset + 1, ent.length - 1);
      const id = idPorUsername(username);
      if (id) ids.add(String(id));
    }
  }

  // IDs escritos a mano: @123456789
  for (const match of texto.matchAll(/@(\d{5,})/g)) ids.add(match[1]);

  return [...ids];
}

/**
 * Enriquece un mensaje de Telegram con todos los campos que usan los plugins.
 * Devuelve el mismo objeto (mutado) para no perder nada de lo original.
 */
export function normalizarMensaje(m) {
  const chatId = m.chat.id;
  const isGroup = m.chat.type === "group" || m.chat.type === "supergroup";

  m.chatId = chatId;
  m.isGroup = isGroup;
  m.isPrivate = m.chat.type === "private";
  m.isCanal = m.chat.type === "channel";
  m.chatName = m.chat.title || m.chat.first_name || "Privado";

  m.senderId = m.from ? String(m.from.id) : String(chatId);
  m.senderName = m.from ? nombreDe(m.from) : m.chatName;
  m.senderUser = m.from?.username || null;
  m.esBot = !!m.from?.is_bot;

  m.text = m.text || m.caption || "";
  m.media = extraerMedia(m);
  m.tipo = m.media?.tipo || (m.text ? "texto" : "otro");
  m.quoted = m.reply_to_message ? normalizarCitado(m.reply_to_message) : null;
  m.mencionados = extraerMenciones(m);

  // El objetivo de un comando: a quien se cita, o el primer mencionado
  m.objetivo = m.quoted?.senderId || m.mencionados[0] || null;

  // Compatibilidad con el estilo anterior
  m.key = {
    id: m.message_id,
    remoteJid: chatId,
    participant: m.senderId,
    fromMe: false
  };
  m.messageId = m.message_id;

  return m;
}

export default { normalizarMensaje, normalizarCitado, extraerMedia, extraerMenciones };
