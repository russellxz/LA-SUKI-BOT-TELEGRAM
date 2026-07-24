// plugins/Parejas.js — Formar parejas al azar en el grupo
import { noEsGrupo, mencion } from "../libs/grupo.js";
import { miembrosDe } from "../libs/usuarios.js";

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  if (await noEsGrupo(msg, conn)) return;
  await conn.react(chatId, msg.message_id, "😍");

  const conocidos = miembrosDe(chatId).filter((u) => !u.bot && String(u.id) !== String(conn.user.id));
  if (conocidos.length < 2) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Necesito conocer al menos a 2 personas del grupo para armar parejas.*"
    }, { quoted: msg });
  }

  const mezclados = conocidos.sort(() => Math.random() - 0.5);
  const cuantas = Math.min(5, Math.floor(mezclados.length / 2));
  const parejas = [];

  for (let i = 0; i < cuantas; i++) {
    const a = mezclados[i * 2];
    const b = mezclados[i * 2 + 1];
    const porcentaje = Math.floor(Math.random() * 101);
    parejas.push(`💘 ${mencion(a.id, a.nombre)} + ${mencion(b.id, b.nombre)} — *${porcentaje}%*`);
  }

  await conn.sendMessage(chatId, {
    text: `💞 *PAREJAS DEL GRUPO* 💞\n\n${parejas.join("\n\n")}\n\n_Puro azar, no se lo tomen en serio 😄_`,
    mentions: mezclados.slice(0, cuantas * 2).map((u) => u.id)
  }, { quoted: msg });
};

handler.command = ["pareja", "parejas"];
export default handler;
