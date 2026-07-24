// plugins/Allmenu.js — Lista completa de comandos, sacada de los plugins cargados
import path from "path";

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

  // Telegram corta los mensajes largos
  const trozos = texto.match(/[\s\S]{1,3800}/g) || [texto];
  for (const trozo of trozos) {
    await conn.sendMessage(chatId, { text: trozo }, { quoted: msg });
    await new Promise((r) => setTimeout(r, 300));
  }
};

handler.command = ["allmenu", "todoslos", "listacomandos"];
export default handler;
