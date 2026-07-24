// plugins/Personalidad.js — Análisis de personalidad (de broma)
import { objetivoDe, mencion } from "../libs/grupo.js";

const rand = () => Math.floor(Math.random() * 101);
const barra = (n) => "█".repeat(Math.round(n / 10)) + "░".repeat(10 - Math.round(n / 10));

const handler = async (msg, { conn, args }) => {
  const chatId = msg.chatId;
  await conn.react(chatId, msg.message_id, "🤔");

  const objetivo = objetivoDe(msg, args) || { id: msg.senderId, nombre: msg.senderName };

  const rasgos = {
    "🌟 Carisma": rand(),
    "🧠 Inteligencia": rand(),
    "😂 Sentido del humor": rand(),
    "💪 Fuerza de voluntad": rand(),
    "❤️ Bondad": rand(),
    "😈 Maldad": rand(),
    "🎭 Drama": rand(),
    "🍕 Glotonería": rand()
  };

  const texto =
    `🎭 *ANÁLISIS DE PERSONALIDAD*\n\n` +
    `👤 ${mencion(objetivo.id, objetivo.nombre)}\n\n` +
    Object.entries(rasgos).map(([k, v]) => `${k}\n${barra(v)} *${v}%*`).join("\n\n") +
    `\n\n_Puro invento, no te lo tomes en serio 😄_`;

  await conn.sendMessage(chatId, { text: texto, mentions: [objetivo.id] }, { quoted: msg });
};

handler.command = ["personalidad"];
export default handler;
