// plugins/pluginsgrupos/Menuaudio.js — Lista los paquetes guardados con .guar
import fs from "fs";
import path from "path";

// Animación del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "video", url: "https://cdn.russellxz.click/18bf4be2.mp4" };


const FILES_DB = path.resolve("./guar_files.json");

const ICONOS = {
  imagen: "🖼️", video: "🎬", audio: "🎵", nota: "🎤",
  sticker: "🌟", documento: "📄", gif: "🎞️", texto: "💬"
};

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "🎵");

  let db = {};
  try {
    if (fs.existsSync(FILES_DB)) db = JSON.parse(fs.readFileSync(FILES_DB, "utf-8"));
  } catch {}

  const claves = Object.keys(db).filter((k) => Array.isArray(db[k]) && db[k].length);

  if (!claves.length) {
    return conn.sendMessage(chatId, {
      text:
        "📭 *Todavía no hay nada guardado.*\n\n" +
        `Responde a una foto, video, audio o sticker con *${usedPrefix}guar <palabra>* para guardarlo.\n` +
        "Después, cuando alguien escriba esa palabra, yo la envío sola."
    }, { quoted: msg });
  }

  claves.sort((a, b) => a.localeCompare(b));

  const lineas = claves.map((clave) => {
    const items = db[clave];
    const tipos = [...new Set(items.map((i) => i.tipo))].map((t) => ICONOS[t] || "📦").join("");
    return `│ ${tipos} *${clave}* — ${items.length}`;
  });

  const total = claves.reduce((acc, k) => acc + db[k].length, 0);

  const texto =
    `╭──『 🎵 *PALABRAS GUARDADAS* 』\n│\n` +
    `│ 📦 Paquetes: *${claves.length}*\n│ 📁 Archivos: *${total}*\n│\n` +
    lineas.join("\n") +
    "\n╰────────────────◆\n\n" +
    `_Escribe la palabra y te mando el archivo._\n` +
    `_Para borrar uno: ${usedPrefix}del <palabra> <número>_`;

  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    gifPlayback: true,
    caption: texto
  }, { quoted: msg });
};

handler.command = ["menuaudio", "guardados", "listaguar"];
export default handler;
