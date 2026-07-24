// plugins/Setprefix.js — Cambiar los prefijos con los que responde el bot
//
// Por defecto responde a:  .comando   #comando   /comando
// El "/" nunca se quita porque es el prefijo nativo de Telegram (el que usa
// el menú de comandos de la app).
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./prefijos.json");
const POR_DEFECTO = [".", "#", "/"];

const handler = async (msg, { conn, args, usedPrefix, command, isOwner }) => {
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "🚫 *Solo el dueño del bot puede cambiar los prefijos.*"
    }, { quoted: msg });
  }

  const opcion = String(args[0] || "").toLowerCase();

  // Volver a los prefijos de siempre
  if (["reset", "default", "defecto", "reiniciar"].includes(opcion)) {
    global.prefixes = [...POR_DEFECTO];
    fs.writeFileSync(ARCHIVO, JSON.stringify(global.prefixes, null, 2));
    await conn.react(chatId, msg.message_id, "✅");
    return conn.sendMessage(chatId, {
      text: `♻️ *Prefijos restaurados:* ${global.prefixes.map((p) => `「 ${p} 」`).join(" ")}`
    }, { quoted: msg });
  }

  // Se aceptan solo símbolos de 1 o 2 caracteres (nada de letras ni números)
  const nuevos = [...new Set(args.filter((a) => a.length >= 1 && a.length <= 2 && !/[\p{L}\p{N}]/u.test(a)))];

  if (!nuevos.length) {
    return conn.sendMessage(chatId, {
      text:
        "🔣 *Prefijos del bot*\n\n" +
        `Ahora mismo respondo a: ${global.prefixes.map((p) => `「 ${p} 」`).join(" ")}\n\n` +
        `*Para cambiarlos:*\n${usedPrefix}${command} . # !\n\n` +
        `*Para dejarlos como estaban:*\n${usedPrefix}${command} reset\n\n` +
        "_El prefijo / siempre queda activo: es el que usa Telegram para su menú de comandos._"
    }, { quoted: msg });
  }

  if (!nuevos.includes("/")) nuevos.push("/");

  global.prefixes = nuevos;
  fs.writeFileSync(ARCHIVO, JSON.stringify(nuevos, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `✅ *Prefijos actualizados:* ${nuevos.map((p) => `「 ${p} 」`).join(" ")}\n\n` +
      `Pruébalo: *${nuevos[0]}menu*\n\n` +
      "_El cambio es inmediato y se guarda para los próximos reinicios._"
  }, { quoted: msg });
};

handler.command = ["setprefix", "prefijo", "prefijos"];
export default handler;
