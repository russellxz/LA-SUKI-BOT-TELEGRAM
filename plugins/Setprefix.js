// plugins/Setprefix.js — Cambiar los prefijos del bot
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./prefijos.json");

const handler = async (msg, { conn, args, usedPrefix, command, isOwner }) => {
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "🚫 *Solo el dueño del bot puede cambiar los prefijos.*"
    }, { quoted: msg });
  }

  const nuevos = args.filter((a) => a.length <= 2 && !/[a-z0-9áéíóúñ]/i.test(a));

  if (!nuevos.length) {
    return conn.sendMessage(chatId, {
      text:
        "🔣 *Prefijos del bot*\n\n" +
        `Ahora mismo: ${global.prefixes.map((p) => `「 ${p} 」`).join(" ")}\n\n` +
        `Para cambiarlos: *${usedPrefix}${command} . # !*\n\n` +
        "_El prefijo *\\/* siempre queda activo porque es el de Telegram._"
    }, { quoted: msg });
  }

  if (!nuevos.includes("/")) nuevos.push("/");
  global.prefixes = nuevos;
  fs.writeFileSync(ARCHIVO, JSON.stringify(nuevos, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ *Prefijos actualizados:* ${nuevos.map((p) => `「 ${p} 」`).join(" ")}\n\n_Ejemplo: ${nuevos[0]}menu_`
  }, { quoted: msg });
};

handler.command = ["setprefix", "prefijo"];
export default handler;
