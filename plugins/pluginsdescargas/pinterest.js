// plugins/pluginsdescargas/pinterest.js — Videos de Pinterest, con botones
"use strict";

import axios from "axios";
import { API_BASE, API_KEY, descargarBuffer } from "../../libs/descargas.js";
import { menuDescarga, opcionesVideo, limpiarNombre } from "../../libs/botonesdescarga.js";
import { ayuda, recortar } from "../../libs/estilo.js";

const esPinterest = (u = "") => /^https?:\/\//i.test(u) && /(pinterest\.[a-z.]+|pin\.it)/i.test(u);

const aAbsoluta = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return u.startsWith("/") ? API_BASE + u : `${API_BASE}/${u}`;
};

async function llamarApi(pin) {
  const r = await axios.post(`${API_BASE}/pinterest`, { url: pin }, {
    timeout: 60000,
    headers: { "Content-Type": "application/json", apikey: API_KEY, Accept: "application/json, */*" },
    validateStatus: () => true
  });

  const data = typeof r.data === "object" ? r.data : null;
  const ok = data && (data.status === true || data.status === "true" || data.ok === true || data.success === true);
  if (!ok) throw new Error(data?.message || data?.error || "Error en la API");

  return data.result || data.data || data;
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const url = String(text || "").trim();
  const pref = usedPrefix || global.prefixes?.[0] || ".";

  if (!url) {
    return conn.sendMessage(chatId, {
      text: ayuda({
        emoji: "📌",
        nombre: "Video de Pinterest",
        para: "Pásame el enlace del pin.",
        usos: [`${pref}${command} <enlace>`],
        ejemplos: [`${pref}${command} https://pin.it/xxxxx`]
      })
    }, { quoted: msg });
  }

  if (!esPinterest(url)) {
    return conn.sendMessage(chatId, { text: "❌ Eso no parece un enlace de Pinterest." }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "⏳");

  try {
    const resultado = await llamarApi(url);
    const titulo = resultado.title || "Pinterest";

    const mp4 =
      aAbsoluta(resultado?.downloads?.video) ||
      aAbsoluta(resultado?.downloads?.video_inline) ||
      aAbsoluta(resultado?.media?.mp4) ||
      "";

    if (!mp4) throw new Error("No encontré MP4 en ese pin (puede ser solo HLS .m3u8)");

    await menuDescarga(conn, msg, {
      emoji: "📌",
      fuente: "Pinterest",
      nombre: titulo,
      miniatura: resultado?.media?.thumbnail || resultado?.thumbnail || "",
      datos: [["👤", "Autor", resultado?.creator?.username ? `@${resultado.creator.username}` : null]],
      enlace: url,
      opciones: opcionesVideo(),
      resolver: async () => {
        const { buffer, tam } = await descargarBuffer(mp4);
        return {
          buffer,
          tam,
          titulo,
          nombre: `${limpiarNombre(titulo, "pinterest")}.mp4`,
          ext: "mp4",
          caption: `📌 *${recortar(titulo, 60)}*`
        };
      }
    });

    await conn.react(chatId, msg.message_id, "✅");
  } catch (e) {
    await conn.react(chatId, msg.message_id, "❌");
    await conn.sendMessage(chatId, {
      text: `❌ No pude descargarlo.\n\n_${String(e?.message || e).slice(0, 250)}_`
    }, { quoted: msg });
  }
};

handler.command = ["pinterestvideo", "pinvideo"];
export default handler;
