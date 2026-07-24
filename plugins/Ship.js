// plugins/Ship.js — Emparejar a dos personas del grupo
import { noEsGrupo, mencion } from "../libs/grupo.js";
import { miembrosDe } from "../libs/usuarios.js";

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  if (await noEsGrupo(msg, conn)) return;
  await conn.react(chatId, msg.message_id, "😍");

  let candidatos = [];

  if (msg.mencionados.length >= 2) {
    candidatos = msg.mencionados.slice(0, 2).map((id) => ({ id }));
  } else {
    const conocidos = miembrosDe(chatId).filter((u) => !u.bot && String(u.id) !== String(conn.user.id));
    if (conocidos.length < 2) {
      return conn.sendMessage(chatId, {
        text:
          "⚠️ *Necesito conocer al menos a 2 personas del grupo.*\n\n" +
          "_Voy aprendiendo a la gente conforme escribe. También puedes mencionar a dos: .ship @uno @dos_"
      }, { quoted: msg });
    }
    const mezclados = conocidos.sort(() => Math.random() - 0.5);
    candidatos = [mezclados[0], mezclados[1]];
  }

  const porcentaje = Math.floor(Math.random() * 101);
  const corazon = porcentaje > 80 ? "💞" : porcentaje > 50 ? "💖" : porcentaje > 25 ? "💔" : "🥀";
  const veredicto =
    porcentaje > 90 ? "¡Almas gemelas! 😍" :
    porcentaje > 70 ? "¡Hacen bonita pareja! 🥰" :
    porcentaje > 40 ? "Podría funcionar... 🤔" :
    porcentaje > 15 ? "Mejor solo amigos 😅" : "Ni lo intenten 😂";

  await conn.sendMessage(chatId, {
    text:
      `${corazon} *SHIP DEL DÍA* ${corazon}\n\n` +
      `${mencion(candidatos[0].id, candidatos[0].nombre)}\n` +
      `        💘\n` +
      `${mencion(candidatos[1].id, candidatos[1].nombre)}\n\n` +
      `📊 Compatibilidad: *${porcentaje}%*\n` +
      `${"█".repeat(Math.round(porcentaje / 10))}${"░".repeat(10 - Math.round(porcentaje / 10))}\n\n` +
      `💬 ${veredicto}`,
    mentions: candidatos.map((c) => c.id)
  }, { quoted: msg });
};

handler.command = ["ship"];
export default handler;
