// plugins/Boton.js — Prueba de botones de Telegram
const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;

  await conn.sendMessage(chatId, {
    text: "🔢 *Botones de prueba*\n\nToca uno de los botones de abajo 👇",
    buttons: [
      [{ text: "✅ Botón 1", callback_data: "demo:1" }, { text: "🎉 Botón 2", callback_data: "demo:2" }],
      [{ text: "🌐 Abrir YouTube", url: "https://youtube.com/@skyultraplus" }]
    ]
  }, { quoted: msg });
};

handler.command = ["boton", "botones"];

handler.iniciar = (conn) => {
  conn.onCallback("demo", async (query, datos) => {
    await conn.responderBoton(query.id, `Tocaste el botón ${datos} ✅`, true);
  });
};

export default handler;
