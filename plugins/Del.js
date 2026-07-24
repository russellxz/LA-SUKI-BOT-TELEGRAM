// plugins/Del.js — Borrar un archivo guardado con .guar
import fs from "fs";
import path from "path";

const FILES_DB = path.resolve("./guar_files.json");

const handler = async (msg, { conn, args, usedPrefix, command, isOwner, isAdmin }) => {
  const chatId = msg.chatId;

  if (!isOwner && !isAdmin) {
    return conn.sendMessage(chatId, {
      text: "🚫 *Solo los administradores o el dueño del bot pueden borrar archivos guardados.*"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "🗑️");

  const numero = parseInt(args[args.length - 1]);
  const paquete = args.slice(0, -1).join(" ").trim().toLowerCase();

  let db = {};
  try {
    if (fs.existsSync(FILES_DB)) db = JSON.parse(fs.readFileSync(FILES_DB, "utf-8") || "{}");
  } catch {}

  if (!paquete || Number.isNaN(numero)) {
    // Sin número: si el paquete existe, se muestra su contenido
    const soloPaquete = args.join(" ").trim().toLowerCase();
    if (soloPaquete && Array.isArray(db[soloPaquete])) {
      const lista = db[soloPaquete]
        .map((it, i) => `${i + 1}. ${it.tipo}${it.fileName ? ` (${it.fileName})` : ""}`)
        .join("\n");
      return conn.sendMessage(chatId, {
        text: `📦 *Paquete "${soloPaquete}"* — ${db[soloPaquete].length} archivo(s)\n\n${lista}\n\n_Para borrar uno: ${usedPrefix}${command} ${soloPaquete} 1_`
      }, { quoted: msg });
    }
    return conn.sendMessage(chatId, {
      text:
        `❗ Usa: *${usedPrefix}${command} <palabra> <número>*\n\n` +
        `*Ejemplos:*\n• ${usedPrefix}${command} hola 2\n• ${usedPrefix}${command} buenos dias 1\n\n` +
        `_Para ver los paquetes: ${usedPrefix}menuaudio_`
    }, { quoted: msg });
  }

  const items = Array.isArray(db[paquete]) ? db[paquete] : null;
  if (!items || !items.length) {
    return conn.sendMessage(chatId, {
      text: `⚠️ No existe ningún paquete llamado *"${paquete}"*.`
    }, { quoted: msg });
  }

  if (numero < 1 || numero > items.length) {
    return conn.sendMessage(chatId, {
      text: `⚠️ Número inválido. El paquete *"${paquete}"* tiene *${items.length}* archivo(s).`
    }, { quoted: msg });
  }

  const [borrado] = items.splice(numero - 1, 1);

  // Borrar también la copia física
  if (borrado?.path) {
    try {
      const ruta = path.resolve(borrado.path);
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    } catch {}
  }

  if (!items.length) delete db[paquete];
  fs.writeFileSync(FILES_DB, JSON.stringify(db, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `🗑️ *Borrado el archivo #${numero}* del paquete *"${paquete}"*.\n\n` +
      (db[paquete] ? `Quedan *${db[paquete].length}* archivo(s).` : "_El paquete quedó vacío y se eliminó._")
  }, { quoted: msg });
};

handler.command = ["del", "delguar"];
export default handler;
