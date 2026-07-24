import fs from 'fs';

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const filePath = "./ventas365.json";

  if (!fs.existsSync(filePath)) {
    return conn.sendMessage(chatId, {
      text: "❌ No hay promociones guardadas aún."
    }, { quoted: msg });
  }

  const ventas = JSON.parse(fs.readFileSync(filePath));
  const data = ventas[chatId]?.setpromo;

  if (!data || (!data.texto && !data.imagen)) {
    return conn.sendMessage(chatId, {
      text: "❌ No hay información de promoción guardada con setpromo."
    }, { quoted: msg });
  }

  if (data.imagen) {
    const buffer = data.imagen;
    await conn.sendMessage(chatId, {
      image: buffer,
      caption: data.texto || "🎁 Promoción del grupo"
    }, { quoted: msg });
  } else {
    await conn.sendMessage(chatId, {
      text: data.texto
    }, { quoted: msg });
  }
};

handler.command = ["promo"];
export default handler;
