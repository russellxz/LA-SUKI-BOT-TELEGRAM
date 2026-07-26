// plugins/Verpacks.js — Ver el contenido de un paquete guardado
import fs from "fs";
import path from "path";

const FILES_DB = path.resolve("./guar_files.json");

const ICONOS = {
  imagen: "🖼️", video: "🎬", audio: "🎵", nota: "🎤",
  sticker: "🌟", documento: "📄", gif: "🎞️", texto: "💬"
};

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "📂");

  let db = {};
  try {
    if (fs.existsSync(FILES_DB)) db = JSON.parse(fs.readFileSync(FILES_DB, "utf-8") || "{}");
  } catch {}

  const claves = Object.keys(db).filter((k) => Array.isArray(db[k]) && db[k].length);
  if (!claves.length) {
    return conn.sendMessage(chatId, {
      text: `📂 *Lista vacía:* todavía no hay nada guardado.\n\n_Guarda algo con ${usedPrefix}guar <palabra>_`
    }, { quoted: msg });
  }

  const buscado = args.join(" ").trim().toLowerCase();

  if (!buscado) {
    const lineas = claves.sort().map((k) => {
      const tipos = [...new Set(db[k].map((i) => i.tipo))].map((t) => ICONOS[t] || "📦").join("");
      return `>| ${tipos} *${k}* — ${db[k].length}`;
    });
    return conn.sendMessage(chatId, {
      text:
        `📂 *PAQUETES GUARDADOS*\n\n${lineas.join("\n")}\n\n` +
        `_Detalle de uno: ${usedPrefix}${command} <palabra>_`
    }, { quoted: msg });
  }

  const items = db[buscado];
  if (!Array.isArray(items)) {
    return conn.sendMessage(chatId, { text: `❌ No existe el paquete *"${buscado}"*.` }, { quoted: msg });
  }

  const detalle = items
    .map((it, i) => {
      const fecha = it.creado ? new Date(it.creado).toLocaleDateString("es-ES") : "?";
      const peso = it.size ? ` · ${(it.size / 1024).toFixed(0)} KB` : "";
      return `${i + 1}. ${ICONOS[it.tipo] || "📦"} ${it.tipo}${peso} · ${fecha}`;
    })
    .join("\n");

  await conn.sendMessage(chatId, {
    text:
      `📂 *Paquete "${buscado}"*\n` +
      `🔢 ${items.length} archivo(s)\n\n${detalle}\n\n` +
      `_Enviar uno: ${usedPrefix}g ${buscado} 1_\n` +
      `_Borrar uno: ${usedPrefix}del ${buscado} 1_`
  }, { quoted: msg });
};

handler.command = ["verpacks", "verguar", "paquetes"];
export default handler;
