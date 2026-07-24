// plugins/pluginsgrupos/Menuaudio.js — Lista los paquetes guardados con .guar
import fs from "fs";
import path from "path";

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

  // Se envía por tandas para no pasarse del límite de Telegram
  const tandas = [];
  for (let i = 0; i < lineas.length; i += 60) tandas.push(lineas.slice(i, i + 60));

  for (let i = 0; i < tandas.length; i++) {
    const encabezado = i === 0
      ? `╭──『 🎵 *PALABRAS GUARDADAS* 』\n│\n│ 📦 Paquetes: *${claves.length}*\n│ 📁 Archivos: *${total}*\n│\n`
      : "╭─────◆\n";
    await conn.sendMessage(chatId, {
      text:
        encabezado + tandas[i].join("\n") + "\n╰────────────────◆" +
        (i === tandas.length - 1
          ? `\n\n_Escribe la palabra y te mando el archivo._\n_Para borrar uno: ${usedPrefix}del <palabra> <número>_`
          : "")
    }, { quoted: i === 0 ? msg : undefined });
  }
};

handler.command = ["menuaudio", "guardados", "listaguar"];
export default handler;
