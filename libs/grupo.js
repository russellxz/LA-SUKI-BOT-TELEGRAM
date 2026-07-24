/**
 * libs/grupo.js — Ayudas para los comandos de grupo.
 *
 * Evita repetir en cada plugin: "¿es grupo?", "¿es admin?", "¿el bot puede
 * hacerlo?", "¿a quién va dirigido el comando?".
 */

import fs from "fs";
import path from "path";
import { idPorUsername, nombreGuardado } from "./usuarios.js";

const ESTADO_PATH = path.resolve("./setwelcome.json");

/* ───────────── Estado por chat (setwelcome.json) ───────────── */

export function leerEstado() {
  try {
    if (!fs.existsSync(ESTADO_PATH)) return {};
    return JSON.parse(fs.readFileSync(ESTADO_PATH, "utf-8") || "{}");
  } catch {
    return {};
  }
}

export function guardarEstado(data) {
  fs.writeFileSync(ESTADO_PATH, JSON.stringify(data, null, 2));
}

/** Lee un valor del estado de un chat */
export function estadoChat(chatId, clave, porDefecto = null) {
  const estado = leerEstado();
  const valor = estado[String(chatId)]?.[clave];
  return valor === undefined ? porDefecto : valor;
}

/** Guarda un valor en el estado de un chat */
export function setEstadoChat(chatId, clave, valor) {
  const estado = leerEstado();
  const id = String(chatId);
  estado[id] = estado[id] || {};
  if (valor === null || valor === undefined) delete estado[id][clave];
  else estado[id][clave] = valor;
  guardarEstado(estado);
  return valor;
}

/** Lista de IDs guardada en el chat (muteados, baneados, restringidos...) */
export function listaChat(chatId, clave) {
  const lista = estadoChat(chatId, clave, []);
  return Array.isArray(lista) ? lista.map(String) : [];
}

export function agregarALista(chatId, clave, valor) {
  const lista = listaChat(chatId, clave);
  const v = String(valor);
  if (lista.includes(v)) return false;
  lista.push(v);
  setEstadoChat(chatId, clave, lista);
  return true;
}

export function quitarDeLista(chatId, clave, valor) {
  const lista = listaChat(chatId, clave);
  const v = String(valor);
  if (!lista.includes(v)) return false;
  setEstadoChat(chatId, clave, lista.filter((x) => x !== v));
  return true;
}

/* ───────────── Verificaciones ───────────── */

/**
 * Verifica que el comando se use en un grupo.
 * @returns {Promise<boolean>} true si NO es grupo (el plugin debe cortar)
 */
export async function noEsGrupo(msg, conn) {
  if (msg.isGroup) return false;
  await conn.sendMessage(msg.chatId, {
    text: "❌ *Este comando solo funciona en grupos.*"
  }, { quoted: msg });
  return true;
}

/**
 * Verifica que quien escribe sea admin del grupo o dueño del bot.
 * @returns {Promise<boolean>} true si NO tiene permiso (el plugin debe cortar)
 */
export async function noEsAdmin(msg, { conn, isAdmin, isOwner }, aviso = null) {
  if (isAdmin || isOwner) return false;
  await conn.sendMessage(msg.chatId, {
    text: aviso || "🚫 *Solo los administradores del grupo o el dueño del bot pueden usar este comando.*"
  }, { quoted: msg });
  return true;
}

/**
 * Verifica que el bot sea admin y tenga cierto permiso.
 * @param {string} permiso can_restrict_members | can_delete_messages | can_change_info | can_invite_users | can_pin_messages | can_promote_members
 * @returns {Promise<boolean>} true si NO puede (el plugin debe cortar)
 */
export async function botNoPuede(msg, conn, permiso) {
  if (await conn.botPuede(msg.chatId, permiso)) return false;

  const explica = {
    can_restrict_members: "expulsar o silenciar gente",
    can_delete_messages: "borrar mensajes",
    can_change_info: "cambiar la información del grupo",
    can_invite_users: "crear enlaces de invitación",
    can_pin_messages: "fijar mensajes",
    can_promote_members: "dar o quitar administradores"
  };

  await conn.sendMessage(msg.chatId, {
    text:
      `⚠️ *No puedo hacer eso.*\n\n` +
      `Necesito ser *administrador* del grupo con permiso para *${explica[permiso] || permiso}*.\n` +
      `Pídele a un admin que me dé ese permiso.`
  }, { quoted: msg });
  return true;
}

/* ───────────── A quién va dirigido el comando ───────────── */

/**
 * Saca el usuario objetivo de un comando: por respuesta, por @mención,
 * por @usuario conocido o por ID numérico escrito a mano.
 * @returns {{ id: string, nombre: string }|null}
 */
export function objetivoDe(msg, args = []) {
  // 1) Respondiendo a un mensaje
  if (msg.quoted?.senderId) {
    return { id: String(msg.quoted.senderId), nombre: msg.quoted.senderName || nombreGuardado(msg.quoted.senderId) };
  }

  // 2) Menciones detectadas por Telegram (@usuario o mención directa)
  if (msg.mencionados?.length) {
    const id = String(msg.mencionados[0]);
    return { id, nombre: nombreGuardado(id) };
  }

  // 3) Escrito a mano: @usuario o ID numérico
  for (const arg of args) {
    const limpio = String(arg).trim();
    if (/^@\w{3,}$/.test(limpio)) {
      const id = idPorUsername(limpio);
      if (id) return { id: String(id), nombre: nombreGuardado(id) };
    }
    if (/^\d{5,}$/.test(limpio)) {
      return { id: limpio, nombre: nombreGuardado(limpio) };
    }
  }

  return null;
}

/** Mensaje estándar cuando no se pudo identificar al usuario */
export function comoIndicarUsuario(prefijo, comando) {
  return (
    `✳️ *¿A quién?*\n\n` +
    `• Responde a un mensaje suyo con *${prefijo}${comando}*\n` +
    `• O menciónalo: *${prefijo}${comando} @usuario*\n` +
    `• O usa su ID: *${prefijo}${comando} 123456789*\n\n` +
    `_Tip: el ID lo puedes ver con el comando *${prefijo}id*_`
  );
}

/** Enlace clickeable a un usuario */
export function mencion(id, nombre = null) {
  return `<a href="tg://user?id=${id}">${nombre || nombreGuardado(id)}</a>`;
}

export default {
  leerEstado, guardarEstado, estadoChat, setEstadoChat,
  listaChat, agregarALista, quitarDeLista,
  noEsGrupo, noEsAdmin, botNoPuede,
  objetivoDe, comoIndicarUsuario, mencion
};
