// plugins/pluginsowner/Setmenugrupo.js — Personalizar el menú de grupos
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./setmenu.json");

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Solo el dueño del bot puede personalizar los menús.*" }, { quoted: msg });
  }

  const cuerpo = (text || "").trim();
  const media = msg.media?.tipo === "imagen" ? msg.media
    : msg.quoted?.media?.tipo === "imagen" ? msg.quoted.media
    : null;
  const textoCitado = msg.quoted?.text || "";

  if (!cuerpo && !media && !textoCitado) {
    return conn.sendMessage(chatId, {
      text:
        "🎨 *Menú de grupos personalizado*\n\n" +
        `• *${usedPrefix}${command} <texto>* → cambia el texto\n` +
        `• Responde a una *imagen* con *${usedPrefix}${command}* → le pone foto\n` +
        `• Responde a una imagen con texto → cambia las dos cosas\n\n` +
        `_Para volver al menú original: ${usedPrefix}del${command.replace("set", "")}_`
    }, { quoted: msg });
  }

  let data = {};
  try {
    if (fs.existsSync(ARCHIVO)) data = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8") || "{}");
  } catch {}

  data.menugrupo = data.menugrupo || {};
  if (cuerpo || textoCitado) data.menugrupo.texto = cuerpo || textoCitado;
  if (media) data.menugrupo.imagen = media.fileId;

  fs.writeFileSync(ARCHIVO, JSON.stringify(data, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      "✅ *Menú de grupos personalizado guardado.*\n\n" +
      (data.menugrupo.texto ? "📝 Texto: sí\n" : "") +
      (data.menugrupo.imagen ? "🖼️ Imagen: sí\n" : "")
  }, { quoted: msg });
};

handler.command = ["setmenugrupo", "setmenug"];
export default handler;
