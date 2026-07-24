// plugins/Hackearbroma.js — Broma de "hackeo" a alguien del grupo
import { objetivoDe, mencion } from "../libs/grupo.js";

const alAzar = (l) => l[Math.floor(Math.random() * l.length)];

const PASOS = [
  "🔓 Rompiendo el cifrado de Telegram...",
  "📡 Rastreando la dirección IP...",
  "💾 Descargando la galería completa...",
  "🔑 Extrayendo contraseñas guardadas...",
  "🏦 Accediendo a la cuenta bancaria...",
  "📱 Clonando el dispositivo...",
  "🛰️ Triangulando ubicación por satélite..."
];

const UBICACIONES = [
  "🚇 Los túneles secretos del metro de Nueva York",
  "🏔️ Una cabaña en los Alpes suizos",
  "🏝️ Una isla privada en el Caribe",
  "🌋 Cerca de un volcán activo en Islandia",
  "🏜️ En medio del desierto del Sahara",
  "🏢 El sótano de un edificio abandonado"
];

const CONTRASENAS = ["123456", "teamoMami", "loveYou<3", "qwerty2024", "papitorico", "elpepe123", "sukibot4ever"];

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text: `😈 *¿A quién quieres "hackear"?*\n\nResponde a su mensaje o menciónalo:\n*${usedPrefix}${command} @usuario*`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "😈");

  const enviado = await conn.sendMessage(chatId, {
    text: `💻 *Iniciando hackeo a ${objetivo.nombre}...*\n\n${PASOS[0]}`
  }, { quoted: msg });

  for (let i = 1; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 1400));
    await conn.editMessage(chatId, enviado.message_id,
      `💻 *Hackeando a ${objetivo.nombre}...*\n\n${PASOS.slice(0, i + 1).map((p) => `✅ ${p}`).join("\n")}`
    );
  }

  await new Promise((r) => setTimeout(r, 1500));

  await conn.sendMessage(chatId, {
    text:
      `💀 *HACKEO COMPLETADO* 💀\n\n` +
      `👤 Víctima: ${mencion(objetivo.id, objetivo.nombre)}\n` +
      `🆔 ID: \`${objetivo.id}\`\n` +
      `📍 Ubicación: ${alAzar(UBICACIONES)}\n` +
      `🔑 Contraseña filtrada: *${alAzar(CONTRASENAS)}*\n` +
      `💰 Saldo en el banco: *$${(Math.random() * 20).toFixed(2)}*\n` +
      `📸 Fotos recuperadas: *${Math.floor(Math.random() * 9000)}*\n\n` +
      `😂 *Es una broma, tranquilo.* Nadie hackeó nada.`,
    mentions: [objetivo.id]
  }, { quoted: msg });
};

handler.command = ["hackear", "hack"];
export default handler;
