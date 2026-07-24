// plugins/pluginsowner/Git.js — Enviar el archivo de un comando del bot
import fs from "fs";
import path from "path";

/** Busca en qué archivo vive un comando */
function buscarArchivo(nombre) {
  const buscado = String(nombre).toLowerCase().replace(/^[./#]/, "");
  for (const plugin of global.plugins) {
    const cmds = Array.isArray(plugin?.command) ? plugin.command.map((c) => String(c).toLowerCase()) : [];
    if (cmds.includes(buscado)) return plugin.__archivo;
  }
  // Si no es un comando, se busca por nombre de archivo
  const directo = global.plugins.find((p) =>
    path.basename(p.__archivo || "", ".js").toLowerCase() === buscado
  );
  return directo?.__archivo || null;
}

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Solo los dueños del bot pueden usar este comando.*" }, { quoted: msg });
  }

  const buscado = (args[0] || "").trim();
  if (!buscado) {
    return conn.sendMessage(chatId, {
      text:
        `📁 *Escribe el comando que quieres descargar.*\n\n` +
        `*Ejemplo:* ${usedPrefix}${command} play\n\n` +
        `_Te envío el archivo .js de ese comando._`
    }, { quoted: msg });
  }

  const archivo = buscarArchivo(buscado);
  if (!archivo || !fs.existsSync(archivo)) {
    return conn.sendMessage(chatId, {
      text: `❌ No encontré ningún comando llamado *${buscado}*.`
    }, { quoted: msg });
  }

  const contenido = fs.readFileSync(archivo);
  const lineas = contenido.toString("utf-8").split("\n").length;

  await conn.sendMessage(chatId, {
    document: contenido,
    fileName: path.basename(archivo),
    caption:
      `📄 *${path.basename(archivo)}*\n\n` +
      `📂 Ruta: \`${archivo}\`\n` +
      `📏 ${lineas} líneas · ${(contenido.length / 1024).toFixed(1)} KB`
  }, { quoted: msg });

  await conn.react(chatId, msg.message_id, "✅");
};

handler.command = ["git", "codigo", "archivo"];
export default handler;
