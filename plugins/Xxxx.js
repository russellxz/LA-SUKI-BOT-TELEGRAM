// plugins/Xxxx.js — Analizar si una imagen tiene contenido +18
import Checker from "../libs/nsfw.js";

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media || (msg.tipo !== "texto" ? msg.media : null);

  if (!media || !["imagen", "sticker"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text:
        `🔞 *Responde a una imagen o sticker* con *${usedPrefix}${command}* para analizarlo.\n\n` +
        "_El analizador solo trabaja con imágenes._"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "👀");

  try {
    const buffer = await conn.downloadMedia(media.fileId);

    // El servicio acepta png/jpg/webp/bmp
    let mime = media.mime || "image/jpeg";
    if (!/^image\/(png|jpeg|webp|bmp)$/.test(mime)) mime = "image/jpeg";

    const checker = new Checker();
    const respuesta = await checker.response(buffer, mime);

    if (!respuesta?.status) throw new Error(respuesta?.msg || "El servicio no respondió");

    const { NSFW, percentage, response } = respuesta.result;

    await conn.sendMessage(chatId, {
      text:
        "🔞 *ANÁLISIS DE CONTENIDO*\n\n" +
        `${response}\n\n` +
        `📊 Confianza: *${percentage}*\n` +
        `📦 Tipo analizado: ${media.tipo}`
    }, { quoted: msg });

    await conn.react(chatId, msg.message_id, NSFW ? "🙈" : "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude analizarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["xxx", "nsfw", "analizar"];
export default handler;
