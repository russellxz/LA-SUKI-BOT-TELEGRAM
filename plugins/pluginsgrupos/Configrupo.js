// plugins/pluginsgrupos/Configrupo.js — Ver toda la configuración del grupo
import { getConfig } from "../../db.js";
import { noEsGrupo, listaChat, estadoChat } from "../../libs/grupo.js";

const marca = (valor) => (global.estaActivo(valor) ? "✅ activado" : "❌ desactivado");

const handler = async (msg, ctx) => {
  const { conn, usedPrefix } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;

  const opciones = [
    ["🛡️ Anti stickers", "antis"],
    ["🔗 Antilink (invitaciones)", "antilink"],
    ["🚷 Bloqueo de enlaces", "linkall"],
    ["👮 Modo solo admins", "modoadmins"],
    ["🚫 Anti árabe", "antiarabe"],
    ["👋 Bienvenidas", "welcome"],
    ["🚪 Despedidas", "despedidas"],
    ["💬 Respuestas automáticas", "reacion"],
    ["🛑 Bot apagado aquí", "apagado"],
    ["🤖 ChatGPT del grupo", "chatgpt"]
  ];

  const filas = opciones.map(([nombre, clave]) => `│ ${nombre}: *${marca(getConfig(chatId, clave))}*`).join("\n");

  const muteados = listaChat(chatId, "muted").length;
  const baneados = listaChat(chatId, "banned").length;
  const restringidos = listaChat(chatId, "restringidos");
  const soyAdmin = await conn.botEsAdmin(chatId);

  const texto =
    `╭──『 ⚙️ *CONFIGURACIÓN* 』\n` +
    `│ 📍 ${msg.chatName}\n` +
    `│\n` +
    filas + "\n" +
    `│\n` +
    `│ 🔇 Silenciados: *${muteados}*\n` +
    `│ 🚫 Baneados del bot: *${baneados}*\n` +
    `│ 🔒 Comandos restringidos: *${restringidos.length}*\n` +
    `│ ${soyAdmin ? "⭐ Soy administradora" : "⚠️ NO soy administradora"}\n` +
    `│ 📜 Reglas: ${estadoChat(chatId, "reglas") ? "definidas" : "sin definir"}\n` +
    `╰────────────────◆\n\n` +
    `_Usa ${usedPrefix}menugrupo para ver cómo cambiar cada cosa._`;

  await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["configrupo", "config", "estado"];
export default handler;
