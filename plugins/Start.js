// plugins/Start.js — Lo primero que ve alguien al abrir el bot
//
// En Telegram, al abrir un bot aparece el botón START, que envía /start.
// Este es el saludo de bienvenida.
const handler = async (msg, { conn, usedPrefix, isOwner }) => {
  const chatId = msg.chatId;
  const p = global.prefixes[0];

  const puedeUsar = isOwner || !msg.isPrivate || global.enListaPrivada?.(msg.senderId) || !global.owner.length;

  const texto =
    `👋 *¡Hola ${msg.senderName}!*\n\n` +
    "Soy *La Suki Bot* 💜 un bot con más de *500 comandos*:\n\n" +
    "🎨 Stickers con efectos\n" +
    "📥 Descargas de YouTube, TikTok, Instagram...\n" +
    "🤖 Inteligencia artificial\n" +
    "👮 Administración de grupos\n" +
    "🎮 RPG y juegos\n\n" +
    (puedeUsar
      ? `📌 Usa *${p}menu* para ver todo lo que puedo hacer.\n` +
        `📌 Agrégame a tu grupo y hazme *admin* para aprovecharme al máximo.`
      : "🔒 Este bot es privado: por aquí solo atiendo a su dueño y a la gente autorizada.\n" +
        "En los grupos donde esté, sí puedes usarme normalmente.");

  await conn.sendMessage(chatId, {
    text: texto,
    buttons: [
      [{ text: "📚 Ver el menú", callback_data: "start:menu" }],
      [{ text: "➕ Agrégame a un grupo", url: `https://t.me/${conn.user.username}?startgroup=true` }]
    ]
  }, { quoted: msg });
};

handler.command = ["start", "iniciar", "hola"];

handler.iniciar = (conn) => {
  conn.onCallback("start", async (query) => {
    await conn.responderBoton(query.id);
    const plugin = global.pluginIndex?.get("menu");
    if (!plugin) return;

    const chatId = query.message.chat.id;
    const fingido = {
      chatId,
      chat: query.message.chat,
      message_id: query.message.message_id,
      from: query.from,
      senderId: String(query.from.id),
      senderName: [query.from.first_name, query.from.last_name].filter(Boolean).join(" "),
      isGroup: query.message.chat.type !== "private",
      isPrivate: query.message.chat.type === "private",
      text: `${global.prefixes[0]}menu`,
      key: { id: query.message.message_id }
    };

    await plugin(fingido, {
      conn,
      text: "",
      args: [],
      command: "menu",
      usedPrefix: global.prefixes[0],
      chatId,
      senderId: fingido.senderId,
      isGroup: fingido.isGroup,
      isOwner: global.isOwner(query.from.id),
      isAdmin: false
    }).catch((e) => console.log("⚠️ botón del menú:", e.message));
  });
};

export default handler;
