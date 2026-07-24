// plugins/pluginsowner/Dellista.js — Quitar el permiso de usar el bot por privado
import fs from "fs";
import path from "path";
import { objetivoDe, comoIndicarUsuario, mencion } from "../../libs/grupo.js";

const ESTADO = path.resolve("./setwelcome.json");

function leerEstado() {
  try {
    if (!fs.existsSync(ESTADO)) return {};
    return JSON.parse(fs.readFileSync(ESTADO, "utf-8") || "{}");
  } catch {
    return {};
  }
}

const handler = async (msg, { conn, args, usedPrefix, command, isOwner }) => {
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, {
      text: "⛔ Este comando solo lo puede usar el *dueño del bot*."
    }, { quoted: msg });
  }

  const estado = leerEstado();
  const lista = Array.isArray(estado.lista) ? estado.lista.map(String) : [];
  const objetivo = objetivoDe(msg, args);

  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text:
        comoIndicarUsuario(usedPrefix, command) +
        (lista.length
          ? `\n\n*En la lista (${lista.length}):*\n` + lista.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n")
          : "\n\n_La lista está vacía._")
    }, { quoted: msg });
  }

  if (!lista.includes(String(objetivo.id))) {
    return conn.sendMessage(chatId, {
      text: `⚠️ ${mencion(objetivo.id, objetivo.nombre)} no estaba en la lista.`
    }, { quoted: msg });
  }

  estado.lista = lista.filter((id) => id !== String(objetivo.id));
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `🗑️ ${mencion(objetivo.id, objetivo.nombre)} salió de la lista: ya no podrá usar el bot por privado.`
  }, { quoted: msg });
};

handler.command = ["dellista", "delvip", "quitarpermiso"];
export default handler;
