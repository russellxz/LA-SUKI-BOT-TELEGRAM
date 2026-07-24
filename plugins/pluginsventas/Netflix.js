import fs from 'fs';

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const filePath = "./ventas365.json";

  if (!fs.existsSync(filePath)) {
    return conn.sendMessage(chatId, { text: "❌ No hay datos guardados aún." }, { quoted: msg });
  }

  const ventas = JSON.parse(fs.readFileSync(filePath));
  const data = ventas[chatId]?.setnetflix;

  if (!data || (!data.texto && !data.imagen)) {
    return conn.sendMessage(chatId, { text: "❌ No hay contenido guardado con setnetflix en este grupo." }, { quoted: msg });
  }

  if (data.imagen) {
    const buffer = data.imagen;
    await conn.sendMessage(chatId, {
      image: buffer,
      caption: data.texto || "📺 Contenido Netflix"
    }, { quoted: msg });
  } else {
    await conn.sendMessage(chatId, { text: data.texto }, { quoted: msg });
  }
};

handler.command = ["netflix"];
export default handler;
