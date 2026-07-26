// plugins/Allmenu.js — Lista completa de comandos, sacada de los plugins cargados
//
// Cada categoría va en una cita PLEGABLE: se ve la cabecera y tú abres la que
// te interese. Así caben los 500 y pico comandos sin tapar toda la pantalla.
import path from "path";
import { citaPlegable } from "../libs/estilo.js";

// Imagen del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "image", url: "https://cdn.russellxz.click/40df9bcb.jpeg" };

const NOMBRES = {
  "plugins": "🌟 GENERAL",
  "plugins/pluginsdescargas": "📥 DESCARGAS",
  "plugins/pluginsgrupos": "👮 GRUPOS",
  "plugins/pluginsowner": "👑 OWNER",
  "plugins/pluginsrpg": "🎮 RPG",
  "plugins/pluginsrpges": "⚔️ CLANES RPG",
  "plugins/pluginsventas": "🛒 VENTAS"
};

/** Reparte los comandos en columnas parejas para que no quede una línea larguísima */
function enColumnas(lista, porFila = 3) {
  const ancho = Math.max(...lista.map((c) => c.length)) + 1;
  const filas = [];
  for (let i = 0; i < lista.length; i += porFila) {
    filas.push(lista.slice(i, i + porFila).map((c) => c.padEnd(ancho)).join("").trimEnd());
  }
  return filas;
}

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "📦");

  // Se agrupan los comandos por la carpeta de cada plugin
  const porCarpeta = new Map();
  for (const plugin of global.plugins) {
    const cmds = Array.isArray(plugin?.command) ? plugin.command : [];
    if (!cmds.length) continue;
    const carpeta = path.dirname(plugin.__archivo || "plugins").replace(/\\/g, "/");
    if (!porCarpeta.has(carpeta)) porCarpeta.set(carpeta, new Set());
    porCarpeta.get(carpeta).add(cmds[0]);
  }

  const orden = Object.keys(NOMBRES).filter((k) => porCarpeta.has(k));
  for (const carpeta of porCarpeta.keys()) if (!orden.includes(carpeta)) orden.push(carpeta);

  const partes = [
    "📦 *TODOS LOS COMANDOS*",
    `_Prefijos:_ ${global.prefixes.join("  ")}`,
    "",
    "_Toca una sección para abrirla_ 👇"
  ];

  for (const carpeta of orden) {
    const lista = [...porCarpeta.get(carpeta)].sort();
    const nombre = NOMBRES[carpeta] || `📁 ${path.basename(carpeta).toUpperCase()}`;
    partes.push("", `${nombre} · *${lista.length}*`);
    partes.push(citaPlegable(enColumnas(lista.map((c) => `${usedPrefix}${c}`))));
  }

  partes.push("", `💜 _Total: *${global.pluginIndex?.size || 0}* comandos contando los alias_`);

  // El adaptador se encarga de partirlo si no cabe en un solo mensaje
  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    caption: partes.join("\n")
  }, { quoted: msg });
};

handler.command = ["allmenu", "todoslos", "listacomandos"];
export default handler;
