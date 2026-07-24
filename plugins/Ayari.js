// plugins/Ayari.js — Mensaje especial paso a paso (con botón "siguiente")
const AYARI_STEPS = [
  {
    type: "text",
    text: `🌸✨ Hola, *Ayari*... tu novio *Russell* quiere decirte algo muy especial. 💌

🎂💕 Hoy es un día hermoso porque celebras tu cumpleaños, mi amor.

👆 Presiona el botón de abajo para ver el siguiente mensajito.`
  },
  {
    type: "text",
    text: `🎉🎂 Hola, amor.

💖 Te deseo un *feliz cumpleaños*, bebé. Aunque no pueda estar contigo en persona, quiero dedicarte unas palabras muy especiales.

🥹💕 Te amo muchísimo, mi bebé. Pásala hermoso en tu día, disfrútalo mucho y sigue viendo lo que preparé para ti. ✨`
  },
  {
    type: "image",
    url: "https://cdn.russellxz.click/db0393ad.jpg",
    caption: `🫶🎮 Sé que, aunque solo sea un avatar dentro del juego, cuando nos miramos de frente te siento cerca de mí.

💞 Siento que conecto contigo, así como nuestros avatares también conectan.

🥰 Te amo, bebé.`
  },
  {
    type: "image",
    url: "https://cdn.russellxz.click/2b3aa183.jpg",
    caption: `🤗💕 Un abrazo tuyo en el juego es lo más real y cercano que siento.

✨ Simplemente se siente bonito, se siente bien, y me hace feliz.

💘 Te amo.`
  },
  {
    type: "image",
    url: "https://cdn.russellxz.click/ba920439.jpg",
    caption: `🫂💗 Cuando estemos juntos en persona, siempre te voy a cargar así.

🥹💕 Me hace mucha ilusión cargarte como a mi bebé hermosa.

🌷 Te amo muchísimo, amor.`
  },
  {
    type: "image",
    url: "https://cdn.russellxz.click/860557c7.jpg",
    caption: `😍🌸 Mírate, bebé... eres tan hermosa. No te cambiaría por nada; sería muy tonto si lo hiciera, porque la verdad me encantas tal y como eres.

💖 Estoy solo para ti. Eres quien me da ánimos todos los días para seguir adelante. Mi motivación eres tú.

✨ Gracias por todo, amor. Te amo muchísimo.`
  },
  {
    type: "text",
    text: `💌🌹 Hola, amor... eso fue todo lo que quería decirte hoy.

🥹💕 Te amo, bebé, y siempre estaré para ti.

🎂✨ Feliz cumpleaños, mi vida. Nunca olvides lo especial que eres para mí. 💖`
  }
];

// sesiones abiertas: id → { paso, chatId }
const sesiones = new Map();

async function enviarPaso(conn, chatId, sesionId, indice, quoted = null) {
  const paso = AYARI_STEPS[indice];
  if (!paso) return;

  const esUltimo = indice >= AYARI_STEPS.length - 1;
  const botones = esUltimo
    ? null
    : { inline_keyboard: [[{ text: "💌 Siguiente mensajito", callback_data: `ayari:${sesionId}:${indice + 1}` }]] };

  const opciones = { quoted, ...(botones ? { reply_markup: botones } : {}) };

  if (paso.type === "image") {
    return conn.sendMessage(chatId, { image: { url: paso.url }, caption: paso.caption || undefined }, opciones);
  }
  if (paso.type === "video") {
    return conn.sendMessage(chatId, { video: { url: paso.url }, caption: paso.caption || undefined }, opciones);
  }
  if (paso.type === "audio") {
    return conn.sendMessage(chatId, { audio: { url: paso.url }, ptt: true }, opciones);
  }
  return conn.sendMessage(chatId, { text: paso.text }, opciones);
}

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const sesionId = `${chatId}_${Date.now().toString(36)}`;
  sesiones.set(sesionId, { paso: 0, chatId });
  await enviarPaso(conn, chatId, sesionId, 0, msg);
};

handler.command = ["ayari"];

handler.iniciar = (conn) => {
  conn.onCallback("ayari", async (query, datos) => {
    const [sesionId, indiceTexto] = datos.split(":");
    const indice = parseInt(indiceTexto);
    const chatId = query.message.chat.id;

    await conn.responderBoton(query.id);

    if (Number.isNaN(indice) || !AYARI_STEPS[indice]) return;

    // se quita el botón del mensaje anterior para que no se repita
    await conn.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: query.message.message_id
    }).catch(() => {});

    await enviarPaso(conn, chatId, sesionId, indice);
  });
};

export default handler;
