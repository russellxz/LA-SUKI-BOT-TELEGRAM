// plugins/ver.js — Reenviar el multimedia de un mensaje citado
//
// En WhatsApp servía para abrir "ver una vez". Telegram no le entrega ese tipo
// de contenido a los bots, así que aquí reenvía cualquier archivo citado
// (útil para sacarlo de un mensaje con spoiler o reenviarlo al chat).
const CAMPO = {
  imagen: "image", video: "video", audio: "audio", nota: "audio",
  sticker: "sticker", documento: "document", gif: "video"
};

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.quoted?.media;

  if (!media) {
    return conn.sendMessage(chatId, {
      text:
        `👀 *Responde a una foto, video, audio o sticker* con *${usedPrefix}${command}* y te lo reenvío.\n\n` +
        "_Nota: Telegram no le entrega a los bots el contenido de \"ver una vez\" ni el de chats protegidos._"
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const paquete = { [CAMPO[media.tipo] || "document"]: media.fileId };
    if (media.tipo === "nota") paquete.ptt = true;
    if (media.tipo === "gif") paquete.gifPlayback = true;
    if (msg.quoted.text && media.tipo !== "sticker") paquete.caption = msg.quoted.text;

    await conn.sendMessage(chatId, paquete, { quoted: msg });
    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude reenviarlo.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["ver", "reenviar"];
export default handler;
