// plugins/pluginsowner/Addlista.js — Dar permiso para usar el bot por privado
//
// Por seguridad, en privado el bot solo le responde a sus dueños y a quienes
// estén en esta lista. En los grupos no afecta: ahí responde a todos.
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
        "📝 *Lista de acceso por privado*\n\n" +
        "Quien esté en esta lista puede usar el bot en su chat privado.\n" +
        "_(En los grupos el bot le responde a todos, esto no los afecta.)_\n\n" +
        comoIndicarUsuario(usedPrefix, command) +
        (lista.length
          ? `\n\n*En la lista (${lista.length}):*\n` + lista.map((id, i) => `${i + 1}. ${mencion(id)}`).join("\n")
          : "\n\n_La lista está vacía: por ahora solo los dueños pueden usar el bot por privado._")
    }, { quoted: msg });
  }

  if (lista.includes(String(objetivo.id))) {
    return conn.sendMessage(chatId, {
      text: `⚠️ ${mencion(objetivo.id, objetivo.nombre)} ya estaba en la lista.`
    }, { quoted: msg });
  }

  lista.push(String(objetivo.id));
  estado.lista = lista;
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `✅ ${mencion(objetivo.id, objetivo.nombre)} fue agregado a la lista.\n\n` +
      `Ya puede escribirle al bot por privado.\n` +
      `_Para quitarlo: ${usedPrefix}dellista_`
  }, { quoted: msg });
};

handler.command = ["addlista", "addvip", "permitir"];
export default handler;
