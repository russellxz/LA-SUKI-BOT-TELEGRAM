// plugins/pluginsdescargas/Groq.js — Preguntarle a la IA (Groq)
import axios from "axios";
import { API_BASE, API_KEY } from "../../libs/descargas.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const pregunta = (text || msg.quoted?.text || "").trim();

  if (!pregunta) {
    return conn.sendMessage(chatId, {
      text:
        `🤖 *Preguntarle a la IA*\n\n` +
        `Usa: *${usedPrefix}${command} <tu pregunta>*\n` +
        "O responde a un mensaje con el comando.\n\n" +
        `*Ejemplo:* ${usedPrefix}${command} explícame qué es un agujero negro`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");
  await conn.sendPresenceUpdate("typing", chatId);

  try {
    const { data } = await axios.post(
      `${API_BASE}/ai`,
      { prompt: pregunta, q: pregunta },
      {
        headers: { apikey: API_KEY, "Content-Type": "application/json", Accept: "application/json" },
        timeout: 120000,
        validateStatus: () => true
      }
    );

    const respuesta =
      data?.result?.response || data?.result?.message || data?.result ||
      data?.data?.response || data?.response || data?.message;

    if (!respuesta || typeof respuesta !== "string") throw new Error("La IA no devolvió respuesta");

    // Telegram corta los mensajes de más de 4096 caracteres
    const trozos = respuesta.match(/[\s\S]{1,3800}/g) || [respuesta];
    for (const trozo of trozos) {
      await conn.sendMessage(chatId, { text: trozo }, { quoted: msg });
    }

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ La IA no pudo responder.\n\n_${String(e.message).slice(0, 200)}_`
    }, { quoted: msg });
  }
};

handler.command = ["groq", "ia2", "preguntar"];
export default handler;
