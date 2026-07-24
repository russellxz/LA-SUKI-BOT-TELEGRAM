/**
 * lib/usuarios.js — Registro de usuarios vistos por el bot.
 *
 * En WhatsApp el bot podía pedir la lista completa de participantes de un
 * grupo. En Telegram la Bot API NO permite listar miembros (solo admins), así
 * que el bot va aprendiendo a la gente conforme escribe o entra al grupo.
 *
 * Aquí se guarda:
 *   - id → { nombre, usuario (@), visto }
 *   - por chat: quién está dentro, cuántos mensajes lleva y cuándo escribió
 *
 * Esto alimenta a: .todos / .tag, .fantasmas, .totalchat, menciones por @user,
 * bienvenidas y cualquier comando que necesite resolver un @usuario a su ID.
 */

import fs from "fs";
import path from "path";

const DB_DIR = path.resolve("./database");
const FILE = path.join(DB_DIR, "usuarios.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let data = { users: {}, chats: {}, usernames: {} };
let dirty = false;

try {
  if (fs.existsSync(FILE)) {
    const raw = fs.readFileSync(FILE, "utf-8").trim();
    if (raw) data = JSON.parse(raw);
  }
} catch (e) {
  console.error("⚠️ usuarios.json corrupto, se regenera:", e.message);
}
data.users = data.users || {};
data.chats = data.chats || {};
data.usernames = data.usernames || {};

let timer = null;
function save() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (!dirty) return;
    try {
      const tmp = `${FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data));
      fs.renameSync(tmp, FILE);
      dirty = false;
    } catch (e) {
      console.error("❌ Error guardando usuarios.json:", e.message);
    }
  }, 1500);
}

process.on("exit", () => {
  if (dirty) {
    try {
      fs.writeFileSync(FILE, JSON.stringify(data));
    } catch {}
  }
});

/** Nombre visible de un usuario de Telegram */
export function nombreDe(user) {
  if (!user) return "Usuario";
  const nombre = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return nombre || user.username || String(user.id);
}

/** Guarda/actualiza un usuario visto (opcionalmente dentro de un chat) */
export function registrarUsuario(user, chatId = null, contarMensaje = false) {
  if (!user || user.is_bot === undefined) return;
  const id = String(user.id);
  const prev = data.users[id] || {};

  data.users[id] = {
    nombre: nombreDe(user),
    usuario: user.username || prev.usuario || null,
    bot: !!user.is_bot,
    visto: Date.now()
  };

  if (user.username) data.usernames[user.username.toLowerCase()] = id;

  if (chatId !== null && chatId !== undefined) {
    const cid = String(chatId);
    if (!data.chats[cid]) data.chats[cid] = {};
    const actual = data.chats[cid][id] || { msgs: 0, entro: Date.now() };
    if (contarMensaje) actual.msgs = (actual.msgs || 0) + 1;
    actual.ultimo = Date.now();
    data.chats[cid][id] = actual;
  }

  save();
}

/** Marca que alguien entró a un chat */
export function registrarEntrada(user, chatId) {
  registrarUsuario(user, chatId, false);
  const cid = String(chatId);
  const id = String(user.id);
  if (data.chats[cid]?.[id]) {
    data.chats[cid][id].entro = Date.now();
    save();
  }
}

/** Marca que alguien salió/fue expulsado de un chat */
export function registrarSalida(userId, chatId) {
  const cid = String(chatId);
  const id = String(userId);
  if (data.chats[cid]?.[id]) {
    delete data.chats[cid][id];
    save();
  }
}

/** Datos guardados de un usuario */
export function obtenerUsuario(userId) {
  return data.users[String(userId)] || null;
}

/** Nombre guardado (o el ID si nunca se ha visto) */
export function nombreGuardado(userId) {
  return data.users[String(userId)]?.nombre || String(userId);
}

/** Resuelve un @usuario a su ID numérico (si el bot ya lo vio alguna vez) */
export function idPorUsername(username) {
  if (!username) return null;
  const clean = String(username).replace(/^@/, "").toLowerCase();
  return data.usernames[clean] || null;
}

/** Miembros conocidos de un chat: [{ id, msgs, ultimo, entro, nombre, usuario }] */
export function miembrosDe(chatId) {
  const cid = String(chatId);
  const miembros = data.chats[cid] || {};
  return Object.entries(miembros).map(([id, info]) => ({
    id,
    msgs: info.msgs || 0,
    ultimo: info.ultimo || 0,
    entro: info.entro || 0,
    nombre: data.users[id]?.nombre || id,
    usuario: data.users[id]?.usuario || null,
    bot: !!data.users[id]?.bot
  }));
}

/** Cantidad de mensajes de un usuario en un chat */
export function mensajesDe(chatId, userId) {
  return data.chats[String(chatId)]?.[String(userId)]?.msgs || 0;
}

/** Reinicia el conteo de mensajes de un chat */
export function reiniciarConteo(chatId) {
  const cid = String(chatId);
  if (!data.chats[cid]) return;
  for (const id of Object.keys(data.chats[cid])) data.chats[cid][id].msgs = 0;
  save();
}

/** Total de mensajes contados en un chat */
export function totalMensajes(chatId) {
  return miembrosDe(chatId).reduce((acc, u) => acc + u.msgs, 0);
}

export default {
  nombreDe,
  registrarUsuario,
  registrarEntrada,
  registrarSalida,
  obtenerUsuario,
  nombreGuardado,
  idPorUsername,
  miembrosDe,
  mensajesDe,
  reiniciarConteo,
  totalMensajes
};
