import fs from 'fs';

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const filePath = "./ventas365.json";

  const ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};
  const data = ventas[chatId]?.setstock;

  if (!data) {
    return conn.sendMessage(chatId, {
      text: "⚠️ No hay stock configurado para este grupo.",
    }, { quoted: msg });
  }

  if (data.imagen) {
    const buffer = data.imagen;
    await conn.sendMessage(chatId, {
      image: buffer,
      caption: data.texto
    }, { quoted: msg });
  } else {
    await conn.sendMessage(chatId, {
      text: data.texto
    }, { quoted: msg });
  }
};

handler.command = ["stock"];
export default handler;
