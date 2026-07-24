// plugins/get.js — Descargar el archivo original de un mensaje citado
import { createCanvas } from "@napi-rs/canvas";

/** Dibuja un texto en una imagen (para guardar mensajes de texto) */
function textoAImagen(texto) {
  const ancho = 1000;
  const margen = 60;
  const canvas = createCanvas(ancho, 200);
  const ctx = canvas.getContext("2d");
  ctx.font = "34px sans-serif";

  // Cortar el texto en líneas que quepan
  const palabras = String(texto).split(/\s+/);
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho - margen * 2) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);

  const alto = Math.max(240, margen * 2 + lineas.length * 46);
  const salida = createCanvas(ancho, alto);
  const c = salida.getContext("2d");

  const degradado = c.createLinearGradient(0, 0, ancho, alto);
  degradado.addColorStop(0, "#5b21b6");
  degradado.addColorStop(1, "#db2777");
  c.fillStyle = degradado;
  c.fillRect(0, 0, ancho, alto);

  c.fillStyle = "#ffffff";
  c.font = "34px sans-serif";
  lineas.forEach((linea, i) => c.fillText(linea, margen, margen + 40 + i * 46));

  return salida.toBuffer("image/png");
}

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;

  if (!msg.quoted) {
    return conn.sendMessage(chatId, {
      text: `📥 *Responde a un mensaje* con *${usedPrefix}${command}* para descargar su contenido como archivo.`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    // Texto → se convierte en imagen
    if (!msg.quoted.media && msg.quoted.text) {
      const imagen = textoAImagen(msg.quoted.text);
      await conn.sendMessage(chatId, {
        image: imagen,
        caption: "📝 *Texto convertido en imagen*"
      }, { quoted: msg });
      return conn.react(chatId, msg.message_id, "✅");
    }

    if (!msg.quoted.media) {
      await conn.react(chatId, msg.message_id, "❌");
      return conn.sendMessage(chatId, {
        text: "❌ Ese mensaje no tiene nada que pueda descargar."
      }, { quoted: msg });
    }

    const media = msg.quoted.media;
    const buffer = await conn.downloadMedia(media.fileId);
    const nombre = media.fileName || `archivo_${Date.now()}.${media.ext || "bin"}`;

    await conn.sendMessage(chatId, {
      document: buffer,
      fileName: nombre,
      caption:
        `📥 *Archivo descargado*\n\n` +
        `📦 Tipo: ${media.tipo}\n` +
        `📏 Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["get", "descargar"];
export default handler;
