// plugins/pluginsdescargas/Apk.js — Buscar y descargar APKs
//
// Primero llega la ficha de la app con su portada y con el botón se baja el
// archivo (el APK siempre va como documento: Telegram no lo reproduce).
import axios from "axios";
import { NEOXR_BASE, NEOXR_KEY, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga } from "../../libs/botonesdescarga.js";

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const consulta = args.join(" ").trim();
  const pref = usedPrefix || global.prefixes?.[0] || ".";

  if (!consulta) {
    return conn.sendMessage(chatId, {
      text: `⚠️ *Uso incorrecto.*\n✳️ *Ejemplo:* ${pref}${command} whatsapp`
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const { data } = await axios.get(`${NEOXR_BASE}/apk`, {
      params: { q: consulta, no: 1, apikey: NEOXR_KEY },
      timeout: 90000,
      headers: { Accept: "application/json, */*" },
      validateStatus: () => true
    });

    if (!data?.status || !data?.data || !data?.file?.url) {
      throw new Error(data?.message || "No encontré información de ese APK");
    }

    const app = data.data;
    const archivo = data.file;

    const info =
      "╭━━━━━━━━━━━━━━━━━╮\n" +
      "  📱 *APK*\n" +
      "╰━━━━━━━━━━━━━━━━━╯\n\n" +
      `📝 *Nombre:* ${app.name}\n` +
      (app.size ? `💾 *Tamaño:* ${app.size}\n` : "") +
      (app.version ? `🏷️ *Versión:* ${app.version}\n` : "") +
      (app.developer ? `👨‍💻 *Desarrollador:* ${app.developer}\n` : "") +
      (app.category ? `📂 *Categoría:* ${app.category}\n` : "") +
      (app.rating ? `⭐ *Rating:* ${app.rating}\n` : "") +
      (app.installs ? `📥 *Instalaciones:* ${app.installs}\n` : "") +
      (app.updated ? `📅 *Actualizado:* ${app.updated}\n` : "") +
      (app.requirements ? `📲 *Requisitos:* ${app.requirements}\n` : "") +
      (app.id ? `🆔 ${app.id}` : "");

    await menuDescarga(conn, msg, {
      titulo: app.name || "apk",
      info,
      miniatura: app.thumbnail || "",
      opciones: [{ id: "f", texto: "📁 Descargar APK", tipo: "documento" }],
      resolver: async () => {
        const { buffer, tam } = await descargarBuffer(archivo.url);
        return {
          buffer,
          tam,
          titulo: app.name,
          nombre: archivo.filename || `${app.name || "app"}.apk`,
          ext: "apk",
          caption: `📱 *${app.name}*`
        };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    console.error("❌ Error en .apk:", e.message);
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ *No pude buscar ese APK.*\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["apk"];
export default handler;
