// plugins/Chatia.js — Respuesta automática con IA en los grupos que la activaron
//
// Se enciende con .chat on. Este plugin no tiene comando: escucha todos los
// mensajes y contesta cuando corresponde.
import axios from "axios";
import { getConfig } from "../db.js";

const ultima = new Map(); // chatId → timestamp (para no saturar la API)

const handler = {};

handler.all = async (msg, { conn }) => {
  try {
    if (!msg.isGroup) return;
    if (!msg.text || msg.text.length < 2) return;
    if (global.prefixes.some((p) => msg.text.startsWith(p))) return;
    if (!global.estaActivo(getConfig(msg.chatId, "chatgpt"))) return;

    // Máximo una respuesta cada 4 segundos por grupo
    const ahora = Date.now();
    if (ahora - (ultima.get(msg.chatId) || 0) < 4000) return;
    ultima.set(msg.chatId, ahora);

    await conn.sendPresenceUpdate("typing", msg.chatId);

    const { data } = await axios.get(
      `https://api.neoxr.eu/api/gpt4-session?q=${encodeURIComponent(msg.text)}&session=${msg.chatId}&apikey=russellxz`,
      { timeout: 45000 }
    );

    const respuesta = data?.data?.message || data?.message;
    if (!respuesta) return;

    await conn.sendMessage(msg.chatId, { text: respuesta }, { quoted: msg });
  } catch (e) {
    // Silencioso: no tiene sentido llenar el grupo de errores de la API
    console.log("⚠️ IA del grupo:", e.message);
  }
};

export default handler;
