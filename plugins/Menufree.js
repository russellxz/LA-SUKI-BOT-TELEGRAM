// plugins/Menufree.js — Menú de Free Fire
//
// Es el mismo que tenía el bot de WhatsApp: mapas, reglas y los versus para
// organizar retos entre clanes.
import { cita } from "../libs/estilo.js";

// Imagen del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "image", url: "https://cdn.russellxz.click/bdd4fca0.jpeg" };

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  const p = usedPrefix;
  await conn.react(chatId, msg.message_id, "🔫");

  const texto = [
    "🔫 *MENÚ FREE FIRE*",
    "_Sistema de retos para clanes_",
    "",
    cita([`🔣 Prefijo: ${p}`, "🎮 Úsalo dentro del grupo"]),
    "",
    "🗺️ *MAPAS Y REGLAS*",
    cita([
      `${p}mapas — sortear el mapa del reto`,
      `${p}reglas — ver las reglas del grupo`,
      `${p}setreglas — cambiarlas (admins)`
    ]),
    "",
    "⚔️ *ARMAR EL VERSUS*",
    cita([
      `${p}4vs4 <hora> — reto de 4 contra 4`,
      `${p}6vs6 <hora> — reto de 6 contra 6`,
      `${p}12vs12 <hora> — reto de 12 contra 12`,
      `${p}16vs16 <hora> — reto de 16 contra 16`,
      `${p}20vs20 <hora> — reto de 20 contra 20`,
      `${p}24vs24 <hora> — reto de 24 contra 24`,
      `${p}guerr <hora> — guerra de clanes`
    ]),
    "",
    `_Ejemplo:_ \`${p}4vs4 5:00pm\``,
    "",
    `📦 _Todo lo demás en_ \`${p}menu\``
  ].join("\n");

  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    caption: texto
  }, { quoted: msg });
};

handler.command = ["menufree", "menuff", "freefire"];
export default handler;
