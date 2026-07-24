// plugins/pluginsowner/Bc.js — Difusión a todos los grupos del bot
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
        `📢 *Difusión a todos los grupos*\n\n` +
        `• *${usedPrefix}${command} <mensaje>*\n` +
        `• O responde a un mensaje (foto, video, sticker, audio...) con *${usedPrefix}${command}*`
    }, { quoted: msg });
  }

  const grupos = listarChats("grupo");
  if (!grupos.length) {
    return conn.sendMessage(chatId, { text: "📭 No tengo grupos registrados todavía." }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendMessage(chatId, {
    text: `📤 Enviando la difusión a *${grupos.length}* grupos...`
  }, { quoted: msg });

  const cabecera = "📢 *DIFUSIÓN DE LA SUKI BOT*\n\n";
  let enviados = 0;
  let fallidos = 0;

  for (const grupo of grupos) {
    try {
      if (contenido?.media) {
        const tipo = contenido.media.tipo;
        const campo = { imagen: "image", video: "video", audio: "audio", nota: "audio", sticker: "sticker", documento: "document", gif: "video" }[tipo] || "document";
        const paquete = { [campo]: contenido.media.fileId };
        if (tipo !== "sticker") paquete.caption = cabecera + (contenido.text || textoSuelto || "");
        if (tipo === "nota") paquete.ptt = true;
        await conn.sendMessage(grupo.id, paquete);
      } else {
        await conn.sendMessage(grupo.id, { text: cabecera + (textoSuelto || contenido?.text || "") });
      }
      enviados++;
    } catch {
      fallidos++;
    }
    await new Promise((r) => setTimeout(r, 400)); // no pasarse del límite de Telegram
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `✅ *Difusión terminada*\n\n📤 Enviados: *${enviados}*\n❌ Fallidos: *${fallidos}*`
  }, { quoted: msg });
};

handler.command = ["bc", "broadcast", "difusion"];
export default handler;
