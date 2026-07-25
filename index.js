/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    👑 LA SUKI BOT — TELEGRAM 👑                   ║
 * ║  Núcleo del bot: conexión, carga de plugins y filtros de mensajes ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Arranque:
 *   1. Toma el token de BotFather de la variable BOT_TOKEN (o token.json,
 *      o preguntándolo por consola la primera vez).
 *   2. Carga todos los plugins de ./plugins (y subcarpetas).
 *   3. Se conecta por long polling y empieza a atender mensajes.
 *
 * IMPORTANTE para grupos: en BotFather usa /setprivacy → Disable, si no
 * Telegram solo le entrega al bot los mensajes que empiezan con "/".
 */

// Los paneles de hosting pintan colores aunque Node no los detecte
if (!process.env.FORCE_COLOR) process.env.FORCE_COLOR = "3";

// Avisos de node-telegram-bot-api que solo ensucian la consola
process.env.NTBA_FIX_319 = "1";
process.env.NTBA_FIX_350 = "1";

import fs from "fs";
import path from "path";
import readline from "readline";
import { pathToFileURL } from "url";
import chalk from "chalk";
import TelegramBot from "node-telegram-bot-api";

import { mostrarBanner } from "./libs/banner.js";
import { Conn } from "./libs/telegram.js";
import { normalizarMensaje } from "./libs/mensajes.js";
import { registrarUsuario, registrarEntrada, registrarSalida, registrarChat, olvidarChat, nombreDe } from "./libs/usuarios.js";
import { getConfig, setConfig, getAllConfigs } from "./db.js";
import "./config.js";

/* ═════════════════════════ 1. TOKEN ═════════════════════════ */

const TOKEN_FILE = path.resolve("./token.json");

function leerTokenGuardado() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
    return typeof data === "string" ? data : data.token || null;
  } catch {
    return null;
  }
}

function guardarToken(token) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }, null, 2));
  console.log(chalk.green(`💾 Token guardado en token.json`));
}

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r); }));
}

async function obtenerToken() {
  const env = (process.env.BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.TOKEN || "").trim();
  if (env) return env;

  const guardado = leerTokenGuardado();
  if (guardado) return guardado;

  console.log(chalk.yellow("\n🔑 No encontré ningún token."));
  console.log(chalk.white("   1. Abre Telegram y habla con @BotFather"));
  console.log(chalk.white("   2. Envía /newbot y sigue los pasos"));
  console.log(chalk.white("   3. Copia el token que te da (algo como 123456789:AAE...)\n"));

  if (!process.stdin.isTTY) {
    console.log(chalk.red("❌ No hay consola interactiva disponible."));
    console.log(chalk.red("   Configura la variable de entorno BOT_TOKEN con tu token y vuelve a iniciar."));
    process.exit(1);
  }

  const token = (await preguntar(chalk.magenta("👉 Pega aquí tu token: "))).trim();
  if (!/^\d{6,}:[\w-]{30,}$/.test(token)) {
    console.log(chalk.red("❌ Ese token no tiene el formato correcto. Reinicia e inténtalo de nuevo."));
    process.exit(1);
  }
  guardarToken(token);
  return token;
}

/* ═════════════════════ 2. PREFIJOS Y OWNERS ═════════════════════ */

let prefijos = [".", "/", "#"];
const prefixPath = path.resolve("./prefijos.json");
if (fs.existsSync(prefixPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(prefixPath, "utf-8").trim());
    if (Array.isArray(parsed) && parsed.length) prefijos = parsed;
    else if (typeof parsed === "string") prefijos = [parsed];
  } catch {}
}
// "/" siempre disponible: es el prefijo natural de Telegram
if (!prefijos.includes("/")) prefijos.push("/");
global.prefixes = prefijos;

const ownerPath = path.resolve("./owner.json");
if (!fs.existsSync(ownerPath)) fs.writeFileSync(ownerPath, "[]");

try {
  global.owner = JSON.parse(fs.readFileSync(ownerPath, "utf-8"));
  if (!Array.isArray(global.owner)) global.owner = [];
} catch {
  global.owner = [];
}

// Owners extra desde variable de entorno (útil en Pterodactyl)
const ownerEnv = (process.env.OWNER_ID || "").split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
for (const id of ownerEnv) {
  if (!global.owner.some((e) => String(Array.isArray(e) ? e[0] : e) === id)) {
    global.owner.push([id, "Owner"]);
  }
}
if (ownerEnv.length) fs.writeFileSync(ownerPath, JSON.stringify(global.owner, null, 2));

/** 🎯 ¿Es dueño del bot? (acepta ID numérico de Telegram) */
global.isOwner = function (userId) {
  const id = String(userId ?? "").replace(/[^0-9]/g, "");
  if (!id) return false;
  return global.owner.some((e) => String(Array.isArray(e) ? e[0] : e).replace(/[^0-9]/g, "") === id);
};

global.guardarOwners = function () {
  fs.writeFileSync(ownerPath, JSON.stringify(global.owner, null, 2));
};

// Código para reclamar la propiedad del bot cuando aún no hay owners
global.codigoDueno = null;
if (!global.owner.length) {
  global.codigoDueno = Math.random().toString().slice(2, 8);
}

/* ═════════════════════ 3. CARGA DE PLUGINS ═════════════════════ */

global.plugins = [];
global.pluginsPorArchivo = new Map();

async function cargarPlugins(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, item.name);
    if (item.isDirectory()) {
      await cargarPlugins(ruta);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith(".js")) continue;
    try {
      const mod = await import(`${pathToFileURL(path.resolve(ruta)).href}?v=${Date.now()}`);
      const plugin = mod.default || mod;
      plugin.__archivo = ruta;
      global.plugins.push(plugin);
      global.pluginsPorArchivo.set(ruta, plugin);
    } catch (err) {
      console.log(chalk.red(`❌ Error al cargar ${ruta}: ${err.message}`));
    }
  }
}

/** ⚡ Índice comando → plugin (despacho O(1)) */
global.buildPluginIndex = function () {
  const index = new Map();
  for (const plugin of global.plugins) {
    const cmds = Array.isArray(plugin?.command) ? plugin.command : [];
    for (const c of cmds) {
      const key = String(c).toLowerCase();
      if (!index.has(key)) index.set(key, plugin);
    }
  }
  global.pluginIndex = index;
  return index;
};

/** 🔄 Recarga todos los plugins en caliente (comando .carga) */
global.recargarPlugins = async function () {
  global.plugins = [];
  global.pluginsPorArchivo = new Map();
  await cargarPlugins("./plugins");
  global.buildPluginIndex();
  await iniciarPlugins();

  return global.plugins.length;
};

/**
 * Registra los comandos en el menú "/" de la app de Telegram.
 * Es lo que hace que al escribir "/" salga la lista con descripciones.
 */
async function publicarComandos() {
  const lista = [
    ["start", "Empezar a usar el bot"],
    ["menu", "Ver todos los comandos"],
    ["allmenu", "Lista completa de comandos"],
    ["menugrupo", "Comandos para administrar grupos"],
    ["menurpg", "Menú del juego RPG"],
    ["play", "Descargar música de YouTube"],
    ["ytmp4", "Descargar video de YouTube"],
    ["tiktok", "Descargar de TikTok"],
    ["s", "Convertir en sticker"],
    ["sks", "Sticker con efectos"],
    ["chatgpt", "Preguntarle a la IA"],
    ["tts", "Convertir texto en voz"],
    ["guar", "Guardar multimedia con una palabra"],
    ["id", "Ver tu ID de Telegram"],
    ["ping", "Ver si el bot responde"],
    ["info", "Información del bot"]
  ]
    .filter(([c]) => global.pluginIndex.has(c))
    .map(([command, description]) => ({ command, description }));

  try {
    await bot.setMyCommands(lista);
    console.log(chalk.gray(`📋 ${lista.length} comandos publicados en el menú de Telegram`));
  } catch (e) {
    console.log(chalk.gray(`⚠️ No pude publicar el menú de comandos: ${e.message}`));
  }
}

async function iniciarPlugins() {
  for (const plugin of global.plugins) {
    const iniciar = plugin.iniciar || plugin.init;
    if (typeof iniciar !== "function" || plugin.__iniciado) continue;
    try {
      await iniciar(global.conn);
      plugin.__iniciado = true;
    } catch (e) {
      console.log(chalk.red(`❌ Error iniciando ${plugin.__archivo}: ${e.message}`));
    }
  }
}

/* ═════════════════════ 4. ARRANQUE ═════════════════════ */

console.clear();
await mostrarBanner("La Suki Bot", "💜 Versión Telegram 💜");

const token = await obtenerToken();

await cargarPlugins("./plugins");
global.buildPluginIndex();
console.log(chalk.green(`✅ ${global.plugins.length} plugins cargados (${global.pluginIndex.size} comandos)`));

const bot = new TelegramBot(token, {
  // El polling se enciende más abajo, cuando ya están listos los manejadores:
  // así no se pierde ningún mensaje que llegue durante el arranque.
  polling: {
    interval: 300,
    autoStart: false,
    params: {
      timeout: 30,
      allowed_updates: JSON.stringify([
        "message", "edited_message", "channel_post", "callback_query",
        "chat_member", "my_chat_member", "chat_join_request", "poll_answer"
      ])
    }
  },
  filepath: false,
  // Permite usar un servidor propio de la Bot API (sube archivos de hasta 2 GB).
  // Se activa con la variable TELEGRAM_API_URL.
  ...(process.env.TELEGRAM_API_URL ? { baseApiUrl: process.env.TELEGRAM_API_URL.replace(/\/+$/, "") } : {})
});

const conn = new Conn(bot);
global.conn = conn;
global.bot = bot;

try {
  await conn.init();
} catch (e) {
  console.log(chalk.red(`\n❌ No pude conectar con Telegram: ${e.message}`));
  console.log(chalk.red("   Revisa que el token sea correcto y que el servidor tenga internet.\n"));
  process.exit(1);
}

console.log(chalk.green(`🤖 Conectado como @${conn.user.username} (ID: ${conn.user.id})`));
console.log(chalk.gray(`🔣 Prefijos: ${global.prefixes.join(" ")}`));

if (global.codigoDueno) {
  console.log(chalk.yellow("\n⚠️  Todavía no hay ningún dueño configurado."));
  console.log(chalk.yellow(`   Escríbele al bot por privado:  .soyowner ${global.codigoDueno}`));
  console.log(chalk.yellow("   (o define la variable OWNER_ID con tu ID de Telegram)\n"));
} else {
  console.log(chalk.gray(`👑 Owners: ${global.owner.map((o) => (Array.isArray(o) ? o[0] : o)).join(", ")}`));
}

console.log(
  chalk.yellow(
    "\n💡 Para que el bot lea TODOS los mensajes de un grupo (antilink, palabras\n" +
    "   guardadas, stickers con comando), en @BotFather usa:\n" +
    "   /setprivacy → elige tu bot → Disable\n"
  )
);

await iniciarPlugins();
await publicarComandos();

/* ═════════════════════ 5. UTILIDADES DEL NÚCLEO ═════════════════════ */

const ESTADO_PATH = path.resolve("./setwelcome.json");

function leerEstado() {
  try {
    if (!fs.existsSync(ESTADO_PATH)) return {};
    return JSON.parse(fs.readFileSync(ESTADO_PATH, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function guardarEstado(data) {
  try {
    fs.writeFileSync(ESTADO_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error guardando setwelcome.json:", e.message);
  }
}
global.leerEstado = leerEstado;
global.guardarEstado = guardarEstado;

/** Lista de IDs guardada en el estado del chat (muteados, baneados...) */
function listaDeChat(chatId, clave) {
  const estado = leerEstado();
  const lista = estado[String(chatId)]?.[clave];
  return Array.isArray(lista) ? lista.map(String) : [];
}
global.listaDeChat = listaDeChat;

/**
 * Lista de usuarios autorizados a usar el bot por privado (.addlista).
 * Se guarda en setwelcome.json bajo la clave "lista", igual que antes.
 */
function leerListaPrivada() {
  const estado = leerEstado();
  return Array.isArray(estado.lista) ? estado.lista.map(String) : [];
}
global.leerListaPrivada = leerListaPrivada;

function enListaPrivada(userId) {
  return leerListaPrivada().includes(String(userId));
}
global.enListaPrivada = enListaPrivada;

const activo = (valor) => {
  const v = String(valor ?? "").trim().toLowerCase();
  return v === "1" || v === "on" || v === "true" || v === "si" || v === "sí";
};
global.estaActivo = activo;

/* ═════════════════════ 6. MENSAJES ═════════════════════ */

const arranque = Date.now();

bot.on("message", async (raw) => {
  try {
    await manejarMensaje(raw);
  } catch (e) {
    console.error(chalk.red("❌ Error procesando mensaje:"), e);
  }
});

bot.on("callback_query", async (query) => {
  try {
    registrarUsuario(query.from, query.message?.chat?.id);
    const atendido = await conn._manejarCallback(query);
    if (!atendido) await conn.responderBoton(query.id);
  } catch (e) {
    console.error(chalk.red("❌ Error en botón:"), e.message);
  }
});

async function manejarMensaje(raw) {
  // Ignorar mensajes de servicio ya tratados en sus propios eventos
  if (raw.new_chat_members || raw.left_chat_member) return;

  // Al arrancar, descartar mensajes viejos acumulados durante el apagón
  if (Date.now() - arranque < 15000 && raw.date && Date.now() / 1000 - raw.date > 120) return;

  const msg = normalizarMensaje(raw);
  const chatId = msg.chatId;
  const senderId = msg.senderId;

  // El propio bot y otros bots no se procesan (evita bucles)
  if (msg.esBot) return;

  registrarUsuario(msg.from, chatId, true);
  registrarChat(msg.chat);

  const texto = msg.text || "";
  const prefijoUsado = global.prefixes.find((p) => texto.startsWith(p));

  // ── Respuestas pendientes (menús interactivos) ──
  if (!prefijoUsado && conn._resolverEspera(msg)) return;
  if (prefijoUsado) conn.cancelarEspera(chatId, senderId);

  // ── Reclamar propiedad del bot la primera vez ──
  if (global.codigoDueno && /^[./#]?soyowner\s+\d+/i.test(texto)) {
    const codigo = texto.trim().split(/\s+/)[1];
    if (codigo === global.codigoDueno) {
      global.owner.push([String(senderId), msg.senderName]);
      global.guardarOwners();
      global.codigoDueno = null;
      await conn.sendMessage(chatId, {
        text: `👑 *¡Listo ${msg.senderName}!*\n\nAhora eres el dueño de este bot.\nUsa *${global.prefixes[0]}menuowner* para ver tus comandos.`
      }, { quoted: msg });
      console.log(chalk.green(`👑 Nuevo dueño: ${msg.senderName} (${senderId})`));
    } else {
      await conn.sendMessage(chatId, { text: "❌ Código incorrecto." }, { quoted: msg });
    }
    return;
  }

  const esOwner = global.isOwner(senderId);
  const esAdmin = msg.isGroup ? await conn.esAdmin(chatId, senderId).catch(() => false) : false;

  // ── Presentación al llegar a un grupo nuevo ──
  if (msg.isGroup) await presentarse(chatId);

  // ── Palabras guardadas con .guar ──
  if (!prefijoUsado && (await responderPalabraClave(msg))) return;

  // ── Stickers con comando (.addco) ──
  const inyectado = await comandoDeSticker(msg);
  // normalize("NFC") junta las letras con tilde o ñ en un solo carácter: hay
  // teclados que las mandan separadas y entonces .darcariño no coincidía.
  const textoFinal = (inyectado || texto).normalize("NFC");
  const prefijoFinal = inyectado
    ? global.prefixes.find((p) => inyectado.startsWith(p))
    : prefijoUsado;

  // ── Antiflood de stickers (.antis) ──
  if (!inyectado && (await antiStickers(msg, esAdmin, esOwner))) return;

  // ── Antilink / bloqueo de enlaces ──
  if (await antilink(msg, esAdmin, esOwner)) return;

  // ── Usuarios silenciados ──
  if (await revisarMute(msg, esAdmin, esOwner)) return;

  // ── Plugins que quieren ver todos los mensajes (IA del grupo, filtros...) ──
  const contextoBase = {
    conn, bot, chatId, senderId,
    isGroup: msg.isGroup, isOwner: esOwner, isAdmin: esAdmin || esOwner,
    esOwner, esAdmin: esAdmin || esOwner,
    usedPrefix: global.prefixes[0], prefix: global.prefixes[0],
    text: textoFinal, args: [], command: null
  };
  for (const p of global.plugins) {
    if (typeof p?.all === "function") {
      Promise.resolve(p.all(msg, contextoBase)).catch(() => {});
    }
  }

  if (!prefijoFinal) return;

  const comando = textoFinal
    .slice(prefijoFinal.length)
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(new RegExp(`@${conn.user.username}$`, "i"), ""); // /comando@MiBot

  if (!comando) return;

  const rawArgs = textoFinal.trim().slice(prefijoFinal.length).trim().slice(comando.length).trim()
    .replace(new RegExp(`^@${conn.user.username}\\s*`, "i"), "");
  const args = rawArgs.length ? rawArgs.split(/\s+/) : [];

  // ── Filtros antes de ejecutar ──
  if (await bloqueadoPorFiltros({ msg, comando, esOwner, esAdmin })) return;

  const plugin = global.pluginIndex?.get(comando) || global.plugins.find((p) => p?.command?.includes?.(comando));
  if (!plugin) return;

  console.log(
    chalk.cyan(`⚡ ${comando}`) +
    chalk.gray(` · ${msg.senderName} (${senderId})`) +
    chalk.gray(` · ${msg.isGroup ? msg.chatName : "privado"}`)
  );

  const contexto = {
    conn,
    bot,
    text: rawArgs,
    args,
    command: comando,
    usedPrefix: prefijoFinal,
    prefix: prefijoFinal,
    chatId,
    senderId,
    isGroup: msg.isGroup,
    isOwner: esOwner,
    isAdmin: esAdmin || esOwner,
    esOwner,
    esAdmin: esAdmin || esOwner
  };

  try {
    if (typeof plugin === "function") await plugin(msg, contexto);
    else if (typeof plugin.run === "function") await plugin.run({ msg, ...contexto });
    else if (typeof plugin.handler === "function") await plugin.handler(msg, contexto);
  } catch (e) {
    console.error(chalk.red(`❌ Error ejecutando ${comando}:`), e);
    await conn.sendMessage(chatId, {
      text: `❌ *Ocurrió un error ejecutando ${comando}*\n\n\`${String(e.message || e).slice(0, 300)}\``
    }, { quoted: msg }).catch(() => {});
  }
}

/* ─────────────── Filtros del núcleo ─────────────── */

async function bloqueadoPorFiltros({ msg, comando, esOwner, esAdmin }) {
  const chatId = msg.chatId;
  const senderId = msg.senderId;

  // 1) Usuarios baneados del bot
  if (!esOwner && listaDeChat(chatId, "banned").includes(String(senderId))) {
    return true;
  }
  if (!esOwner && listaDeChat("global", "banned").includes(String(senderId))) return true;

  // 2) EN PRIVADO el bot solo atiende a los dueños y a los de la lista (.addlista).
  //    Así cualquiera que lo encuentre por su @usuario no puede usarlo por su
  //    cuenta. Esto aplica siempre, aunque el modo privado esté apagado.
  // /start siempre pasa: si no, quien abra el bot no vería ni un saludo
  const comandosLibres = ["start", "iniciar", "hola", "soyowner"];
  if (msg.isPrivate && global.owner.length && !esOwner && !enListaPrivada(senderId) && !comandosLibres.includes(comando)) {
    console.log(
      chalk.gray(`⛔ Privado bloqueado · ${msg.senderName} (${senderId}) · ${comando}`)
    );
    return true;
  }

  // 3) Bot apagado en este grupo (solo el dueño puede prenderlo)
  if (activo(getConfig(chatId, "apagado")) && !esOwner && comando !== "on" && comando !== "prender") {
    return true;
  }

  // 4) Modo privado global: en grupos, solo los dueños
  if (activo(getConfig("global", "modoprivado")) && !esOwner) return true;

  // 5) Modo solo-admins del grupo
  if (msg.isGroup && activo(getConfig(chatId, "modoadmins")) && !esAdmin && !esOwner) {
    return true;
  }

  // 6) Comandos restringidos en este grupo (.re / .unre)
  const restringidos = listaDeChat(chatId, "restringidos");
  if (restringidos.includes(comando) && !esAdmin && !esOwner) {
    await conn.sendMessage(chatId, {
      text: `🚫 El comando *${comando}* está restringido en este grupo.`
    }, { quoted: msg }).catch(() => {});
    return true;
  }

  return false;
}

/* ─────────────── Presentación en grupos nuevos ─────────────── */

const presentados = new Set();

async function presentarse(chatId) {
  const clave = String(chatId);
  if (presentados.has(clave)) return;
  presentados.add(clave);

  const estado = leerEstado();
  estado[clave] = estado[clave] || {};
  if (estado[clave].presentationSent) return;

  estado[clave].presentationSent = true;
  guardarEstado(estado);

  const pref = global.prefixes[0];
  await conn.sendMessage(chatId, {
    text:
      "🎉 *¡Hola a todos!* 🎉\n\n" +
      "👋 Soy *La Suki Bot*, un bot de Telegram 🤖\n" +
      "📸 A veces reacciono o envío multimedia porque así me programaron.\n\n" +
      "⚠️ *Lo que diga no debe tomarse en serio* 😉\n\n" +
      `📌 Usa *${pref}menu* o *${pref}menugrupo* para ver todo lo que puedo hacer.\n` +
      "💖 ¡Gracias por tenerme en el grupo!"
  }).catch(() => {});
}

/* ─────────────── Palabras guardadas (.guar) ─────────────── */

const GUAR_DB = path.resolve("./guar_files.json");

function limpiarClave(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]/g, "");
}

async function responderPalabraClave(msg) {
  try {
    const texto = msg.text;
    if (!texto || texto.length > 60) return false;

    // El grupo puede apagar esta función con .reacion off
    const estadoReaccion = getConfig(msg.chatId, "reacion");
    if (estadoReaccion && !activo(estadoReaccion)) return false;

    if (!fs.existsSync(GUAR_DB)) return false;
    let db = {};
    try {
      db = JSON.parse(fs.readFileSync(GUAR_DB, "utf-8"));
    } catch {
      return false;
    }

    const buscado = limpiarClave(texto);
    if (!buscado) return false;

    for (const clave of Object.keys(db)) {
      if (limpiarClave(clave) !== buscado) continue;
      const items = db[clave];
      if (!Array.isArray(items) || !items.length) continue;

      const item = items[Math.floor(Math.random() * items.length)];
      const enviar = {};

      if (item.fileId) {
        // Reenvío directo por file_id (lo más rápido en Telegram)
        const mapa = {
          imagen: "image", video: "video", audio: "audio", nota: "audio",
          sticker: "sticker", documento: "document", gif: "video"
        };
        const campo = mapa[item.tipo] || "document";
        enviar[campo] = item.fileId;
        if (item.tipo === "nota") enviar.ptt = true;
        if (item.tipo === "gif") enviar.gifPlayback = true;
      } else if (item.path && fs.existsSync(path.resolve(item.path))) {
        const buf = fs.readFileSync(path.resolve(item.path));
        const ext = String(item.ext || "").toLowerCase();
        if (["jpg", "jpeg", "png"].includes(ext)) enviar.image = buf;
        else if (["mp4", "mkv", "webm"].includes(ext)) enviar.video = buf;
        else if (["mp3", "ogg", "opus", "m4a"].includes(ext)) enviar.audio = buf;
        else if (ext === "webp") enviar.sticker = buf;
        else {
          enviar.document = buf;
          enviar.fileName = item.fileName || `archivo.${ext}`;
        }
      } else if (item.texto) {
        enviar.text = item.texto;
      } else {
        continue;
      }

      if (item.caption && !enviar.sticker) enviar.caption = item.caption;
      await conn.sendMessage(msg.chatId, enviar, { quoted: msg });
      return true;
    }
  } catch (e) {
    console.error("❌ Error en palabras guardadas:", e.message);
  }
  return false;
}

/* ─────────────── Stickers con comando (.addco) ─────────────── */

const COMANDOS_STICKER = path.resolve("./comandos.json");

async function comandoDeSticker(msg) {
  try {
    if (msg.tipo !== "sticker" || !msg.media?.uniqueId) return null;
    if (!fs.existsSync(COMANDOS_STICKER)) return null;

    const mapa = JSON.parse(fs.readFileSync(COMANDOS_STICKER, "utf-8") || "{}");
    const guardado = mapa[msg.media.uniqueId];
    if (!guardado || typeof guardado !== "string" || !guardado.trim()) return null;

    const cmd = guardado.trim();
    const conPrefijo = global.prefixes.some((p) => cmd.startsWith(p)) ? cmd : global.prefixes[0] + cmd;

    // El sticker se comporta igual que si hubieran escrito el comando
    msg.text = conPrefijo;
    msg.__desdeSticker = true;
    return conPrefijo;
  } catch (e) {
    console.error("❌ Error en sticker→comando:", e.message);
    return null;
  }
}

/* ─────────────── Antiflood de stickers (.antis) ─────────────── */

const stickerSpam = new Map();

async function antiStickers(msg, esAdmin, esOwner) {
  try {
    if (!msg.isGroup || msg.tipo !== "sticker") return false;
    if (esAdmin || esOwner) return false;
    if (!activo(getConfig(msg.chatId, "antis"))) return false;
    if (!(await conn.botPuede(msg.chatId, "can_delete_messages"))) return false;

    const clave = `${msg.chatId}:${msg.senderId}`;
    const ahora = Date.now();
    const datos = stickerSpam.get(clave) || { conteo: 0, ultimo: ahora, avisado: false, strikes: 0 };

    if (ahora - datos.ultimo > 15000) {
      datos.conteo = 1;
      datos.avisado = false;
      datos.strikes = 0;
    } else {
      datos.conteo++;
    }
    datos.ultimo = ahora;

    if (datos.conteo === 5 && !datos.avisado) {
      datos.avisado = true;
      await conn.sendMessage(msg.chatId, {
        text: `⚠️ @${msg.senderId} llevas *5 stickers* seguidos. Espera *15 segundos* o serás expulsado.`,
        mentions: [msg.senderId]
      }).catch(() => {});
    }

    if (datos.conteo > 5) {
      await conn.deleteMessage(msg.chatId, msg.message_id);
      datos.strikes++;
      if (datos.strikes >= 3) {
        await conn.sendMessage(msg.chatId, {
          text: `❌ @${msg.senderId} fue expulsado por abusar de los stickers.`,
          mentions: [msg.senderId]
        }).catch(() => {});
        await conn.kick(msg.chatId, msg.senderId).catch(() => {});
        stickerSpam.delete(clave);
        return true;
      }
      stickerSpam.set(clave, datos);
      return true;
    }

    stickerSpam.set(clave, datos);
  } catch (e) {
    console.error("❌ Error en antis:", e.message);
  }
  return false;
}

/* ─────────────── Antilink ─────────────── */

const ADV_PATH = path.resolve("./advertencias.json");
const RE_LINK_TG = /(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.dog)\/(?:joinchat\/|\+)?[\w-]+/i;
const RE_LINK = /https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}/i;

async function antilink(msg, esAdmin, esOwner) {
  try {
    if (!msg.isGroup || esAdmin || esOwner) return false;
    const texto = msg.text || "";
    if (!texto) return false;

    const modoAntilink = activo(getConfig(msg.chatId, "antilink"));
    const modoLinkall = activo(getConfig(msg.chatId, "linkall"));
    if (!modoAntilink && !modoLinkall) return false;

    const esInvitacion = RE_LINK_TG.test(texto);
    const hayLink = RE_LINK.test(texto);

    // antilink → solo invitaciones a otros grupos/canales
    // linkall  → cualquier enlace que no sea invitación
    const infringe = (modoAntilink && esInvitacion) || (modoLinkall && hayLink && !esInvitacion);
    if (!infringe) return false;

    if (await conn.botPuede(msg.chatId, "can_delete_messages")) {
      await conn.deleteMessage(msg.chatId, msg.message_id);
    }

    let advertencias = {};
    try {
      if (fs.existsSync(ADV_PATH)) advertencias = JSON.parse(fs.readFileSync(ADV_PATH, "utf-8"));
    } catch {}

    const chat = String(msg.chatId);
    advertencias[chat] = advertencias[chat] || {};
    const total = (Number(advertencias[chat][msg.senderId]) || 0) + 1;
    advertencias[chat][msg.senderId] = total;

    if (total >= 3) {
      advertencias[chat][msg.senderId] = 0;
      await conn.sendMessage(msg.chatId, {
        text: `❌ @${msg.senderId} fue expulsado por enviar enlaces (3/3).`,
        mentions: [msg.senderId]
      }).catch(() => {});
      if (await conn.botPuede(msg.chatId, "can_restrict_members")) {
        await conn.kick(msg.chatId, msg.senderId).catch(() => {});
      }
    } else {
      await conn.sendMessage(msg.chatId, {
        text: `⚠️ @${msg.senderId}, aquí no se permiten ${modoLinkall ? "enlaces" : "invitaciones a otros grupos"}.\nAdvertencia: *${total}/3*`,
        mentions: [msg.senderId]
      }).catch(() => {});
    }

    fs.writeFileSync(ADV_PATH, JSON.stringify(advertencias, null, 2));
    return true;
  } catch (e) {
    console.error("❌ Error en antilink:", e.message);
    return false;
  }
}

/* ─────────────── Usuarios silenciados (.mute) ─────────────── */

const muteAvisos = new Map();

async function revisarMute(msg, esAdmin, esOwner) {
  try {
    if (!msg.isGroup || esOwner || esAdmin) return false;
    const muteados = listaDeChat(msg.chatId, "muted");
    if (!muteados.includes(String(msg.senderId))) return false;

    if (await conn.botPuede(msg.chatId, "can_delete_messages")) {
      await conn.deleteMessage(msg.chatId, msg.message_id);
    }

    const clave = `${msg.chatId}:${msg.senderId}`;
    const veces = (muteAvisos.get(clave) || 0) + 1;
    muteAvisos.set(clave, veces);

    if (veces === 1 || veces % 5 === 0) {
      await conn.sendMessage(msg.chatId, {
        text: `🔇 @${msg.senderId} estás *silenciado* en este grupo.`,
        mentions: [msg.senderId]
      }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

/* ═════════════════════ 7. EVENTOS DE GRUPO ═════════════════════ */

bot.on("new_chat_members", async (raw) => {
  try {
    const chatId = raw.chat.id;
    for (const user of raw.new_chat_members || []) {
      if (String(user.id) === String(conn.user.id)) {
        // El bot fue agregado a un grupo
        console.log(chalk.green(`➕ Agregado al grupo: ${raw.chat.title} (${chatId})`));
        presentados.delete(String(chatId));
        registrarChat(raw.chat);
        await presentarse(chatId);
        continue;
      }
      registrarEntrada(user, chatId);
      conn.ev.emit("entrada", { chatId, user, chat: raw.chat, msg: raw });
    }
  } catch (e) {
    console.error("❌ Error en entrada:", e.message);
  }
});

bot.on("left_chat_member", async (raw) => {
  try {
    const chatId = raw.chat.id;
    const user = raw.left_chat_member;
    if (!user) return;
    if (String(user.id) === String(conn.user.id)) {
      console.log(chalk.yellow(`➖ Me sacaron del grupo: ${raw.chat.title} (${chatId})`));
      olvidarChat(chatId);
      return;
    }
    registrarSalida(user.id, chatId);
    conn.ev.emit("salida", { chatId, user, chat: raw.chat, msg: raw });
  } catch (e) {
    console.error("❌ Error en salida:", e.message);
  }
});

// Cambios de estado del propio bot (lo hicieron admin, lo sacaron, etc.)
bot.on("my_chat_member", async (update) => {
  try {
    conn.limpiarCacheAdmins(update.chat.id);
    conn._botMember.delete(String(update.chat.id));
    const estado = update.new_chat_member?.status;
    if (estado === "administrator") {
      console.log(chalk.green(`⭐ Ahora soy admin en ${update.chat.title || update.chat.id}`));
    }
  } catch {}
});

// Cambios de admins del grupo → refrescar caché y avisar
bot.on("chat_member", async (update) => {
  try {
    conn.limpiarCacheAdmins(update.chat.id);
    const nuevo = update.new_chat_member;
    const viejo = update.old_chat_member;
    if (!nuevo?.user) return;

    const chatId = update.chat.id;
    const eraAdmin = ["administrator", "creator"].includes(viejo?.status);
    const esAdminAhora = ["administrator", "creator"].includes(nuevo.status);

    if (["member", "administrator", "creator"].includes(nuevo.status)) {
      registrarEntrada(nuevo.user, chatId);
    } else if (["left", "kicked"].includes(nuevo.status)) {
      registrarSalida(nuevo.user.id, chatId);
    }

    if (!eraAdmin && esAdminAhora) {
      conn.ev.emit("ascenso", { chatId, user: nuevo.user, autor: update.from, chat: update.chat });
    } else if (eraAdmin && !esAdminAhora && nuevo.status === "member") {
      conn.ev.emit("descenso", { chatId, user: nuevo.user, autor: update.from, chat: update.chat });
    }
  } catch {}
});

// Solicitudes de ingreso al grupo (para el filtro automático)
bot.on("chat_join_request", async (peticion) => {
  try {
    registrarUsuario(peticion.from);
    conn.ev.emit("solicitud", { chatId: peticion.chat.id, user: peticion.from, chat: peticion.chat });
  } catch {}
});

/* ═════════════════════ 8. ERRORES ═════════════════════ */

bot.on("polling_error", (e) => {
  const desc = e?.response?.body?.description || e.message || String(e);
  if (/409|terminated by other getUpdates/i.test(desc)) {
    console.log(chalk.red("⚠️  Hay OTRA instancia del bot usando el mismo token."));
    console.log(chalk.red("   Apaga la otra o usa un token distinto."));
    return;
  }
  if (/401|unauthorized/i.test(desc)) {
    console.log(chalk.red("❌ Token inválido o revocado. Genera uno nuevo con @BotFather."));
    process.exit(1);
  }
  console.log(chalk.red(`⚠️  Error de conexión: ${desc}`));
});

bot.on("error", (e) => console.error(chalk.red("⚠️ Error del bot:"), e.message));

process.on("uncaughtException", (err) => {
  console.error(chalk.red("⚠️ Error no capturado:"), err);
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("🚨 Promesa sin manejar:"), reason);
});

// Aviso de reinicio con .carga / .rest
const RESTART_FILE = path.resolve("./lastRestarter.json");
if (fs.existsSync(RESTART_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(RESTART_FILE, "utf-8"));
    if (data.chatId) {
      await conn.sendMessage(data.chatId, { text: "✅ *La Suki Bot ya está en línea otra vez* 🚀" });
    }
  } catch {}
  fs.unlinkSync(RESTART_FILE);
}

// Ahora sí: a escuchar mensajes (todos los manejadores ya están registrados)
await bot.startPolling();

console.log(chalk.green("\n✅ Bot en línea. Esperando mensajes...\n"));
