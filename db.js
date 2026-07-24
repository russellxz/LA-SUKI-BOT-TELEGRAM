/**
 * db.js — Base de datos de configuración por chat (100% JSON, sin dependencias
 * nativas). Antes usaba better-sqlite3; en Pterodactyl compilar módulos nativos
 * suele fallar, así que ahora todo se guarda en ./database/config.json con
 * escritura atómica y caché en memoria.
 *
 * La API pública es la misma de siempre:
 *   setConfig(chatId, key, value)
 *   getConfig(chatId, key)
 *   deleteConfig(chatId, key)
 *   getAllConfigs(chatId)
 *   getAntideleteDB() / saveAntideleteDB(data)
 */

import fs from "fs";
import path from "path";

const DB_DIR = path.resolve("./database");
const CONFIG_PATH = path.join(DB_DIR, "config.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

/** { [chatId]: { [key]: string } } */
let store = {};
let dirty = false;

function loadStore() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8").trim();
      store = raw ? JSON.parse(raw) : {};
      if (!store || typeof store !== "object") store = {};
      return;
    }
  } catch (e) {
    console.error("⚠️ config.json corrupto, se regenera:", e.message);
  }
  store = {};
  persist(true);
}

function persist(force = false) {
  if (!dirty && !force) return;
  try {
    const tmp = `${CONFIG_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, CONFIG_PATH);
    dirty = false;
  } catch (e) {
    console.error("❌ No se pudo guardar config.json:", e.message);
  }
}

loadStore();

// Guardado diferido: agrupa muchas escrituras seguidas en una sola.
let saveTimer = null;
function scheduleSave() {
  dirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist();
  }, 400);
}

const norm = (chatId) => String(chatId);

/**
 * 🔧 Guardar o actualizar una configuración
 * @param {string|number} chatId - ID del grupo o chat de Telegram
 * @param {string} key - Clave como "modoadmins"
 * @param {string|number|boolean} value - Valor (1, 0, "on", "off"...)
 */
function setConfig(chatId, key, value) {
  const id = norm(chatId);
  if (!store[id]) store[id] = {};
  store[id][key] = String(value);
  scheduleSave();
}

/**
 * 🔎 Obtener el valor de una configuración
 * @returns {string|null} Valor guardado o null
 */
function getConfig(chatId, key) {
  const id = norm(chatId);
  const value = store[id]?.[key];
  return value === undefined || value === null ? null : String(value);
}

/** ❌ Eliminar una configuración */
function deleteConfig(chatId, key) {
  const id = norm(chatId);
  if (store[id] && key in store[id]) {
    delete store[id][key];
    if (!Object.keys(store[id]).length) delete store[id];
    scheduleSave();
  }
}

/** 📋 Todas las configuraciones de un chat */
function getAllConfigs(chatId) {
  return { ...(store[norm(chatId)] || {}) };
}

/** 📋 Todos los chats que tienen una clave (opcionalmente con cierto valor) */
function getChatsWith(key, value = null) {
  const out = [];
  for (const [chatId, cfg] of Object.entries(store)) {
    if (!(key in cfg)) continue;
    if (value === null || String(cfg[key]) === String(value)) out.push(chatId);
  }
  return out;
}

// ===========================
// 💾 Almacén auxiliar por chat (listas, avisos, datos sueltos)
// ===========================

const AUX_PATH = path.join(DB_DIR, "aux.json");

function getAntideleteDB() {
  try {
    if (!fs.existsSync(AUX_PATH)) {
      const init = { g: {}, p: {} };
      fs.writeFileSync(AUX_PATH, JSON.stringify(init, null, 2));
      return init;
    }
    const raw = fs.readFileSync(AUX_PATH, "utf-8").trim();
    if (!raw) return { g: {}, p: {} };
    return JSON.parse(raw);
  } catch {
    return { g: {}, p: {} };
  }
}

function saveAntideleteDB(data) {
  try {
    fs.writeFileSync(AUX_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error guardando aux.json:", e.message);
  }
}

// Guardar antes de cerrar para no perder cambios pendientes
process.on("exit", () => persist(true));
process.on("SIGINT", () => {
  persist(true);
  process.exit(0);
});
process.on("SIGTERM", () => {
  persist(true);
  process.exit(0);
});

export {
  setConfig,
  getConfig,
  deleteConfig,
  getAllConfigs,
  getChatsWith,
  getAntideleteDB,
  saveAntideleteDB
};
