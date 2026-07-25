// plugins/pluginsgrupos/Unmute.js — Devolverle la voz a un usuario
import { noEsGrupo, noEsAdmin, objetivoDe, mencion, listaChat, quitarDeLista } from "../../libs/grupo.js";

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "⛔ *Solo administradores o dueños del bot pueden usar este comando.*")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    const muteados = listaChat(chatId, "muted");
    const lista = muteados.length
      ? "\n\n*Silenciados aquí:*\n" + muteados.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n")
      : "\n\n_No hay nadie silenciado en este grupo._";
    return conn.sendMessage(chatId, {
      text: "⚠️ Responde o menciona al usuario que quieres desmutear." + lista
    }, { quoted: msg });
  }

  quitarDeLista(chatId, "muted", objetivo.id);

  // Borrar también la hora de fin, por si estaba silenciado por tiempo
  const estado = global.leerEstado();
  const id = String(chatId);
  if (estado[id]?.mutehasta?.[String(objetivo.id)]) {
    delete estado[id].mutehasta[String(objetivo.id)];
    if (!Object.keys(estado[id].mutehasta).length) delete estado[id].mutehasta;
    global.guardarEstado(estado);
  }

  if (await conn.botPuede(chatId, "can_restrict_members")) {
    await conn.desilenciar(chatId, objetivo.id).catch(() => {});
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🔊 ${mencion(objetivo.id, objetivo.nombre)} ya puede volver a escribir.`
  });
};

handler.command = ["unmute", "desilenciar"];
export default handler;
