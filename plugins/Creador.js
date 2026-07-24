// plugins/Creador.js — Contacto del creador del bot
import { nombreGuardado } from "../libs/usuarios.js";

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "👑");

  const duenos = global.owner
    .map((o) => (Array.isArray(o) ? o : [o]))
    .map(([id, nombre]) => `• <a href="tg://user?id=${id}">${nombre || nombreGuardado(id)}</a>`)
    .join("\n");

  await conn.sendMessage(chatId, {
    text:
      "👑 *CREADOR DE LA SUKI BOT*\n\n" +
      "🧑‍💻 *Russell* (russellxz)\n" +
      "🎬 YouTube: https://youtube.com/@skyultraplus\n\n" +
      (duenos ? `*Dueños de esta instancia:*\n${duenos}\n\n` : "") +
      "💜 Gracias por usar el bot."
  }, { quoted: msg });
};

handler.command = ["creador", "owner", "contacto", "dueno"];
export default handler;
