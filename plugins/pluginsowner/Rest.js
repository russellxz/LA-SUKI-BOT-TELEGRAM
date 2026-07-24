// plugins/pluginsowner/Rest.js — Reiniciar el bot
import fs from "fs";
import path from "path";

const handler = async (msg, ctx) => {
  const { conn, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ Este comando es solo para el *dueño del bot*." }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendMessage(chatId, {
    text:
      "🔄 *Reiniciando el bot...*\n\n" +
      "_Si el hosting tiene el reinicio automático activado (Pterodactyl lo hace), vuelvo en unos segundos._"
  }, { quoted: msg });

  try {
    fs.writeFileSync(path.resolve("./lastRestarter.json"), JSON.stringify({ chatId, fecha: Date.now() }, null, 2));
  } catch {}

  setTimeout(() => process.exit(0), 1200);
};

handler.command = ["rest", "restart", "reiniciar"];
export default handler;
