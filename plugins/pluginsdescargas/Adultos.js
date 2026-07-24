// plugins/pluginsdescargas/Adultos.js — Descargas +18 (xvideos, xnxx, pornhub)
//
// Solo funciona si el chat lo tiene permitido: en grupos hace falta activarlo
// con .nsfw on (así no aparece contenido +18 donde no debe).
import axios from "axios";
import { getConfig, setConfig } from "../../db.js";
import { API_BASE, API_KEY } from "../../libs/descargas.js";

const FUENTES = {
  xvideos: { ruta: "/tools/xvideos", nombre: "XVideos", dominio: /xvideos\.com/i },
  xnxx: { ruta: "/xnxx", nombre: "XNXX", dominio: /xnxx\.com/i },
  porn: { ruta: "/phfans", nombre: "PornHub", dominio: /pornhub|phfans/i }
};

async function resolver(fuente, url) {
  const { data, status } = await axios.post(
    `${API_BASE}${FUENTES[fuente].ruta}`,
    { url },
    {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      timeout: 180000,
      validateStatus: () => true
    }
  );

  let cuerpo = data;
  if (typeof cuerpo === "string") {
    try {
      cuerpo = JSON.parse(cuerpo.trim());
    } catch {
      throw new Error(`El servidor respondió algo raro (HTTP ${status})`);
    }
  }

  if (!cuerpo || (cuerpo.status !== true && cuerpo.ok !== true && cuerpo.success !== true)) {
    throw new Error(cuerpo?.message || cuerpo?.error || `Error del servidor (HTTP ${status})`);
  }

  const resultado = cuerpo.result || cuerpo.data || cuerpo;
  const video =
    resultado.download || resultado.url || resultado.video ||
    resultado.media?.url || resultado.media?.video || "";

  return {
    titulo: resultado.title || FUENTES[fuente].nombre,
    duracion: resultado.duration || "",
    miniatura: resultado.thumbnail || resultado.image || "",
    video: String(video).startsWith("/") ? API_BASE + video : video
  };
}

const handler = async (msg, { conn, text, args, usedPrefix, command, isAdmin, isOwner }) => {
  const chatId = msg.chatId;

  // Interruptor del grupo
  if (["nsfw", "adultos"].includes(command)) {
    if (msg.isGroup && !isAdmin && !isOwner) {
      return conn.sendMessage(chatId, { text: "🚫 Solo los administradores pueden cambiar esto." }, { quoted: msg });
    }
    const estado = String(args[0] || "").toLowerCase();
    if (!["on", "off"].includes(estado)) {
      return conn.sendMessage(chatId, {
        text:
          `🔞 *Contenido +18*\n\nEstado: *${global.estaActivo(getConfig(chatId, "nsfw")) ? "permitido ✅" : "bloqueado ❌"}*\n\n` +
          `Usa: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*`
      }, { quoted: msg });
    }
    setConfig(chatId, "nsfw", estado === "on" ? 1 : 0);
    return conn.sendMessage(chatId, {
      text: `🔞 Contenido +18 *${estado === "on" ? "permitido ✅" : "bloqueado ❌"}* en este chat.`
    }, { quoted: msg });
  }

  if (msg.isGroup && !global.estaActivo(getConfig(chatId, "nsfw"))) {
    return conn.sendMessage(chatId, {
      text:
        "🔞 *El contenido +18 está bloqueado en este grupo.*\n\n" +
        `Un administrador puede permitirlo con *${usedPrefix}nsfw on*`
    }, { quoted: msg });
  }

  const url = (text || "").trim();
  const fuente =
    ["xvideos", "xv"].includes(command) ? "xvideos" :
    ["xnxx", "xx"].includes(command) ? "xnxx" : "porn";

  if (!url || !/^https?:\/\//i.test(url)) {
    return conn.sendMessage(chatId, {
      text:
        `🔞 *Descargar de ${FUENTES[fuente].nombre}*\n\n` +
        `Usa: *${usedPrefix}${command} <enlace>*\n\n` +
        "_Solo acepto enlaces directos al video._"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await resolver(fuente, url);
    if (!datos.video) throw new Error("No encontré el video en ese enlace");

    await conn.sendMessage(chatId, {
      video: { url: datos.video },
      fileName: "video.mp4",
      caption:
        `🔞 *${datos.titulo}*\n` +
        (datos.duracion ? `⏱️ ${datos.duracion}\n` : "") +
        `📥 ${FUENTES[fuente].nombre}`
    }, { quoted: msg, protegido: true });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["xvideos", "xv", "xnxx", "xx", "porn", "nsfw", "adultos"];
export default handler;
