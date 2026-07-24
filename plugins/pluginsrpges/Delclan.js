// plugins/delclan.js
// Comando: .delclan
// Borra el clan del usuario (solo si es LÍDER) tras confirmación respondiendo "si" al mensaje.
// No permite borrar el clan supremo. Responde siempre citando y caduca en 2 minutos.

import fs from 'fs';
import path from 'path';


function loadDB(p) { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {}; }
function saveDB(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 2)); }

const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const sender = msg.senderId;
  const numero = (sender || "").replace(/\D/g, "");

  // reacción inicial
  await conn.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

  const file = path.join(process.cwd(), "sukirpg.json");
  if (!fs.existsSync(file)) {
    return conn.sendMessage(chatId, { text: "❌ La base de datos RPG aún no existe." }, { quoted: msg });
  }

  let db = loadDB(file);
  db.usuarios = Array.isArray(db.usuarios) ? db.usuarios : [];
  db.clanes   = Array.isArray(db.clanes)   ? db.clanes   : [];

  const user = db.usuarios.find(u => String(u.numero) === String(numero));
  if (!user) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, { text: "❌ No estás registrado en el RPG." }, { quoted: msg });
  }

  // Clan donde el usuario es líder
  const clan = db.clanes.find(c =>
    c.lider && c.lider.numero && String(c.lider.numero) === String(numero)
  );

  if (!clan) {
    await conn.sendMessage(chatId, { react: { text: "ℹ️", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: "📭 No eres líder de ningún clan. Solo el líder puede borrarlo."
    }, { quoted: msg });
  }

  // No permitir borrar el clan supremo
  if (clan.esSupremo) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: "🚫 No puedes borrar el *clan supremo*."
    }, { quoted: msg });
  }

  // Mensaje de confirmación (responder con "si")
  await conn.sendMessage(chatId, {
    text:
      `⚠️ ¿Seguro que quieres *ELIMINAR* el clan *${clan.nombre}*?\n\n` +
      "Es permanente y sacará del clan a todos sus miembros.\n\n" +
      "📝 Responde escribiendo:\n*si*\n\n_Tienes 2 minutos._"
  }, { quoted: msg });

  const respuesta = await conn.esperarRespuesta(chatId, sender, 2 * 60 * 1000);

  if (!respuesta) {
    return conn.sendMessage(chatId, {
      text: "⏳ La solicitud para eliminar el clan expiró por inactividad."
    }, { quoted: msg });
  }

  if (String(respuesta.text || "").trim().toLowerCase() !== "si") {
    return conn.sendMessage(chatId, {
      text: "❎ Cancelado. El clan sigue en pie."
    }, { quoted: respuesta });
  }

  // Releemos la base por si cambió mientras esperábamos
  const db2 = loadDB(file);
  db2.clanes = db2.clanes || [];
  const idx = db2.clanes.findIndex(c => String(c.id) === String(clan.id));

  if (idx === -1) {
    return conn.sendMessage(chatId, { text: "❌ Ese clan ya no existe." }, { quoted: respuesta });
  }

  const clanObj = db2.clanes[idx];

  if (clanObj.esSupremo) {
    return conn.sendMessage(chatId, { text: "🚫 No puedes borrar el *clan supremo*." }, { quoted: respuesta });
  }

  if (!(clanObj.lider && String(clanObj.lider.numero) === String(numero))) {
    return conn.sendMessage(chatId, {
      text: "🚫 Ya no eres el líder de este clan, no puedes borrarlo."
    }, { quoted: respuesta });
  }

  db2.clanes.splice(idx, 1);
  saveDB(file, db2);

  await conn.react(chatId, respuesta.message_id, "🗑️");
  await conn.sendMessage(chatId, {
    text: `✅ El clan *${clanObj.nombre}* fue eliminado correctamente.`
  }, { quoted: respuesta });
};

handler.command = ["delclan"];
export default handler;
