// plugins/pluginsowner/Bc2.js — Difusión a los chats privados del bot
import { listarChats } from "../../libs/usuarios.js";

const handler = async (msg, ctx) => {
  const { conn, text, usedPrefix, command, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⚠️ Solo el *dueño del bot* puede usar este comando." }, { quoted: msg });
  }

  const contenido = msg.quoted;
  const textoSuelto = (text || "").trim();

  if (!contenido && !textoSuelto) {
    return conn.sendMessage(chatId, {
      text:
        `📢 *Difusión a los chats privados*\n\n` +
        `• *${usedPrefix}${command} <mensaje>*\n` +
        `• O responde a un mensaje con *${usedPrefix}${command}*\n\n` +
        `_Para los grupos usa ${usedPrefix}bc_`
    }, { quoted: msg });
  }

  const privados = listarChats("privado");
  if (!privados.length) {
    return conn.sendMessage(chatId, { text: "📭 Todavía nadie me ha escrito por privado." }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendMessage(chatId, { text: `📤 Enviando a *${privados.length}* chats privados...` }, { quoted: msg });

  const cabecera = "📢 *MENSAJE DE LA SUKI BOT*\n\n";
  let enviados = 0;
  let fallidos = 0;

  for (const chat of privados) {
    try {
      if (contenido?.media) {
        const tipo = contenido.media.tipo;
        const campo = { imagen: "image", video: "video", audio: "audio", nota: "audio", sticker: "sticker", documento: "document", gif: "video" }[tipo] || "document";
        const paquete = { [campo]: contenido.media.fileId };
        if (tipo !== "sticker") paquete.caption = cabecera + (contenido.text || textoSuelto || "");
        if (tipo === "nota") paquete.ptt = true;
        await conn.sendMessage(chat.id, paquete);
      } else {
        await conn.sendMessage(chat.id, { text: cabecera + (textoSuelto || contenido?.text || "") });
      }
      enviados++;
    } catch {
      fallidos++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ *Difusión terminada*\n\n📤 Enviados: *${enviados}*\n❌ Fallidos: *${fallidos}*\n\n_Los que nunca me han escrito no reciben nada (Telegram lo impide)._`
  }, { quoted: msg });
};

handler.command = ["bc2", "broadcastpv"];
export default handler;
