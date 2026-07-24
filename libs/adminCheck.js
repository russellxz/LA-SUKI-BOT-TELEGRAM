/**
 * libs/adminCheck.js — Permisos del bot (owner / admin) para Telegram.
 *
 * Uso en plugins:
 *   import { isAdminInGroup, isOwnerCheck, getSenderPerms } from '../libs/adminCheck.js';
 *
 * En Telegram cada persona tiene un ID numérico fijo, así que ya no hace falta
 * nada de la resolución LID/número que necesitaba WhatsApp.
 */

import fs from "fs";
import path from "path";

const OWNER_PATH = path.resolve("./owner.json");

/** Solo dígitos (los IDs de Telegram son numéricos) */
export const soloId = (v) => String(v ?? "").replace(/[^0-9]/g, "");

/** Lee owner.json y devuelve la lista de IDs dueños del bot */
export function leerOwners() {
  try {
    if (!fs.existsSync(OWNER_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(OWNER_PATH, "utf-8"));
    if (!Array.isArray(data)) return [];
    return data
      .map((entrada) => (Array.isArray(entrada) ? entrada[0] : entrada))
      .map(soloId)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Guarda la lista de owners (formato [[id, nombre], ...]) */
export function guardarOwners(lista) {
  fs.writeFileSync(OWNER_PATH, JSON.stringify(lista, null, 2));
  global.owner = lista;
}

/** ¿Este ID es dueño del bot? */
export function isOwnerCheck(userId) {
  const id = soloId(userId);
  if (!id) return false;

  if (Array.isArray(global.owner)) {
    for (const entrada of global.owner) {
      const valor = Array.isArray(entrada) ? entrada[0] : entrada;
      if (soloId(valor) === id) return true;
    }
    return false;
  }
  return leerOwners().includes(id);
}

/** ¿Es admin del grupo? (creador incluido) */
export async function isAdminInGroup(conn, chatId, userId) {
  try {
    return await conn.esAdmin(chatId, soloId(userId));
  } catch {
    return false;
  }
}

/** ¿El bot es admin del grupo? */
export async function isBotAdmin(conn, chatId) {
  try {
    return await conn.botEsAdmin(chatId);
  } catch {
    return false;
  }
}

/**
 * Permisos completos de quien mandó el mensaje.
 * @returns {Promise<{ isAdmin: boolean, isOwner: boolean, isBotAdmin: boolean, fromMe: boolean, senderId: string }>}
 */
export async function getSenderPerms(conn, msg) {
  const senderId = String(msg.senderId ?? msg.from?.id ?? "");
  const chatId = msg.chatId ?? msg.chat?.id;
  const isGroup = msg.isGroup ?? (msg.chat?.type || "").includes("group");
  const isOwner = isOwnerCheck(senderId);

  if (!isGroup) {
    return { isAdmin: false, isOwner, isBotAdmin: false, fromMe: false, senderId };
  }

  const [isAdmin, botAdmin] = await Promise.all([
    isAdminInGroup(conn, chatId, senderId),
    isBotAdmin(conn, chatId)
  ]);

  return { isAdmin: isAdmin || isOwner, isOwner, isBotAdmin: botAdmin, fromMe: false, senderId };
}

export default { isOwnerCheck, isAdminInGroup, isBotAdmin, getSenderPerms, leerOwners, guardarOwners, soloId };
