// plugins/Allmenu.js — Lista completa de comandos, sacada de los plugins cargados
import path from "path";

// Imagen del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "image", url: "https://cdn.russellxz.click/40df9bcb.jpeg" };

const NOMBRES = {
  "plugins": "🌟 GENERAL",
  "plugins/pluginsgrupos": "👮 GRUPOS",
  "plugins/pluginsowner": "👑 OWNER",
  "plugins/pluginsdescargas": "📥 DESCARGAS",
  "plugins/pluginsrpg": "🎮 RPG",
  "plugins/pluginsrpges": "⚔️ CLANES RPG",
  "plugins/pluginsventas": "🛒 VENTAS"
};

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

  let texto = `📦 *TODOS LOS COMANDOS*\n🔣 Prefijos: ${global.prefixes.join(" ")}\n`;

  for (const carpeta of orden) {
    const lista = [...porCarpeta.get(carpeta)].sort();
    texto += `\n${NOMBRES[carpeta] || `📁 ${path.basename(carpeta)}`} _(${lista.length})_\n`;
    texto += lista.map((c) => `${usedPrefix}${c}`).join("  ") + "\n";
  }

  texto += `\n_Total: *${global.pluginIndex?.size || 0}* comandos (contando los alias)_`;

  // El adaptador se encarga de partirlo si no cabe en un solo mensaje
  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    caption: texto
  }, { quoted: msg });
};

handler.command = ["allmenu", "todoslos", "listacomandos"];
export default handler;
