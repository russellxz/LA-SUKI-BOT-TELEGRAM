// plugins/Ssy.js — Guardar una imagen bajo un nombre y recuperarla
import fs from "fs";
import path from "path";

const DB = path.resolve("./ssy_db.json");

function leer() {
  try {
    if (fs.existsSync(DB)) return JSON.parse(fs.readFileSync(DB, "utf-8") || "{}");
  } catch {}
  return {};
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const clave = String(text || "").trim().toLowerCase();
  const db = leer();

  if (!clave) {
    const claves = Object.keys(db);
    return conn.sendMessage(chatId, {
      text:
        "🖼️ *Guardar imágenes por nombre*\n\n" +
        `• Responde a una imagen con *${usedPrefix}${command} <nombre>* para guardarla\n` +
        `• Escribe *${usedPrefix}${command} <nombre>* para que te la mande\n\n` +
        (claves.length ? `*Guardadas:*\n${claves.map((k) => `• ${k}`).join("\n")}` : "_Todavía no hay ninguna._")
    }, { quoted: msg });
  }

  const media = msg.quoted?.media || (msg.tipo === "imagen" ? msg.media : null);

  // Guardar
  if (media?.tipo === "imagen") {
    db[clave] = { fileId: media.fileId, user: msg.senderId, creado: Date.now() };
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
    await conn.react(chatId, msg.message_id, "✅");
    return conn.sendMessage(chatId, {
      text: `✅ Imagen guardada como *"${clave}"*.\n\n_Pídemela con ${usedPrefix}${command} ${clave}_`
    }, { quoted: msg });
  }

  // Recuperar
  const guardada = db[clave];
  if (!guardada) {
    return conn.sendMessage(chatId, {
      text: `❌ No tengo ninguna imagen llamada *"${clave}"*.\n\n_Responde a una imagen con ${usedPrefix}${command} ${clave} para guardarla._`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { image: guardada.fileId, caption: `🖼️ *${clave}*` }, { quoted: msg });
};

handler.command = ["ssy"];
export default handler;
