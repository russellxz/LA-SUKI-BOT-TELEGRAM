// plugins/pluginsdescargas/Fb.js — Descargar videos de Facebook, con botones
//
// Igual que el bot de WhatsApp: llega la vista previa con la portada y eliges
// si lo quieres como video normal o como documento.
import { descargarFacebook, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga, opcionesVideo, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, recortar } from "../../libs/estilo.js";

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  let url = (text || "").trim().replace(/^<|>$/g, "");

  // Igual que el bot de WhatsApp: se acepta el enlace aunque venga sin https://
  if (/^(www\.)?(facebook\.com|fb\.watch|fb\.me)\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;

  if (!url || !/facebook\.com|fb\.watch|fb\.me/i.test(url)) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "📘",
        nombre: "Descargar de Facebook",
        para: "Pásame el enlace de un video y te lo bajo.",
        usos: [`${usedPrefix}${command} <enlace>`],
        ejemplos: [`${usedPrefix}${command} https://fb.watch/xxxx`, `${usedPrefix}${command} https://www.facebook.com/share/v/xxxx`]
      })
    }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const datos = await descargarFacebook(url);
    const titulo = datos.titulo || "Facebook Video";

    await menuDescarga(conn, msg, {
      emoji: "📘",
      fuente: "Facebook",
      nombre: titulo,
      miniatura: datos.miniatura || "",
      enlace: url,
      opciones: opcionesVideo(),
      resolver: async () => {
        // Primero el endpoint de la API (ya sirve el archivo listo) y, si
        // falla, el enlace directo del CDN de Facebook.
        const candidatos = [datos.video, datos.directo].filter((v, i, a) => v && a.indexOf(v) === i);

        let ultimo;
        for (const enlace of candidatos) {
          try {
            const { buffer, tam } = await descargarBuffer(enlace);
            return {
              buffer,
              tam,
              titulo,
              nombre: `${limpiarNombre(titulo, "facebook")}.mp4`,
              ext: "mp4",
              caption: `📘 *${recortar(titulo, 60)}*`
            };
          } catch (e) {
            ultimo = e;
            console.log("⚠️ fb:", e.message);
          }
        }
        throw ultimo || new Error("No pude bajar el video");
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text:
        `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 250)}_\n\n` +
        "_Los videos privados o de cuentas cerradas no se pueden bajar._"
    }, { quoted: msg });
  }
};

handler.command = ["facebook", "fb"];
export default handler;
