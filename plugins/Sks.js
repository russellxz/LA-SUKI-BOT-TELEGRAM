// plugins/Sks.js — Creador de stickers con 54 efectos
//
// Responde a una imagen o video con .sks, elige el efecto en los botones y el
// bot te devuelve el sticker ya convertido al formato de Telegram.
import fs from "fs";
import path from "path";
import { ffmpeg, hayFfmpeg, imageToWebp } from "../libs/fuctions.js";

const EFECTOS = {
  normal: { label: "🖼️ Normal", filtro: null },
  flip_h: { label: "↔️ Voltear Derecha", filtro: "hflip" },
  flip_v: { label: "↕️ Voltear Izquierda", filtro: "vflip" },
  rot90: { label: "🔄 Voltear Redondo 90°", filtro: "transpose=1" },
  rot180: { label: "🔃 De Cabeza 180°", filtro: "transpose=2,transpose=2" },
  rot270: { label: "🔁 Voltear Redondo 270°", filtro: "transpose=2" },
  zoom_in: { label: "🔍 Zoom In", filtro: "crop=iw/1.5:ih/1.5:(iw-iw/1.5)/2:(ih-ih/1.5)/2" },
  zoom_out: { label: "🔭 Zoom Out", filtro: "scale=iw*0.7:ih*0.7,pad=iw/0.7:ih/0.7:(ow-iw)/2:(oh-ih)/2:color=0x00000000" },
  redondo: { label: "⭕ Sticker Redondo", filtro: "format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(hypot(X-W/2,Y-H/2),min(W,H)/2),255,0)'" },
  cuadrado: { label: "⬛ Forma Cuadrada", filtro: "pad=iw+40:ih+40:20:20:color=black" },
  bn: { label: "⚫ Blanco y Negro", filtro: "hue=s=0" },
  negativo: { label: "🌓 Negativo", filtro: "negate" },
  sepia: { label: "🟤 Sepia", filtro: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131" },
  rojo: { label: "🔴 Tono Rojo", filtro: "hue=h=0:s=1.5" },
  azul: { label: "🔵 Tono Azul", filtro: "hue=h=210:s=1.5" },
  verde: { label: "🟢 Tono Verde", filtro: "hue=h=120:s=1.5" },
  amarillo: { label: "🟡 Tono Amarillo", filtro: "hue=h=60:s=1.5" },
  rosa: { label: "💖 Tono Rosa", filtro: "hue=h=330:s=1.5" },
  morado: { label: "🟣 Tono Morado", filtro: "hue=h=270:s=1.5" },
  naranja: { label: "🧡 Tono Naranja", filtro: "hue=h=30:s=1.5" },
  brillo: { label: "☀️ Más Brillo", filtro: "eq=brightness=0.15:saturation=1.3" },
  contraste: { label: "🎯 Más Contraste", filtro: "eq=contrast=1.5:saturation=1.2" },
  saturado: { label: "🌈 Súper Saturado", filtro: "eq=saturation=2.5" },
  oscuro: { label: "🌑 Oscuro", filtro: "eq=brightness=-0.15:contrast=1.3" },
  calido: { label: "🌞 Cálido", filtro: "colorbalance=rs=0.3:gs=0.1:bs=-0.3" },
  frio: { label: "❄️ Frío", filtro: "colorbalance=rs=-0.3:gs=-0.1:bs=0.3" },
  difuminado: { label: "🌫️ Difuminado Suave", filtro: "gblur=sigma=3" },
  difuminado_fuerte: { label: "💨 Difuminado Fuerte", filtro: "gblur=sigma=8" },
  pixelado: { label: "🔳 Pixelado", filtro: "scale=iw/8:ih/8,scale=iw*8:ih*8:flags=neighbor" },
  mosaico: { label: "📺 Mosaico Gigante", filtro: "scale=iw/15:ih/15,scale=iw*15:ih*15:flags=neighbor" },
  bit8: { label: "🖥️ 8-Bit Retro", filtro: "scale=iw/6:ih/6,scale=iw*6:ih*6:flags=neighbor,eq=saturation=2" },
  glitch_rgb: { label: "⚡ Glitch RGB", filtro: "rgbashift=rh=8:bv=8:gh=-8" },
  tv_vieja: { label: "📺 TV Vieja", filtro: "noise=alls=25:allf=t" },
  grano: { label: "🎞️ Grano de Película", filtro: "noise=c0s=20:allf=t+u" },
  crt: { label: "💿 CRT Vintage", filtro: "curves=vintage,noise=alls=15:allf=t" },
  vhs: { label: "📼 VHS", filtro: "curves=vintage,noise=c0s=8:allf=t,rgbashift=rh=3:bv=3" },
  vintage: { label: "📷 Vintage", filtro: "curves=vintage,vignette" },
  dibujo: { label: "🖋️ Dibujo / Edges", filtro: "edgedetect=mode=wires" },
  lapiz: { label: "✏️ Lápiz", filtro: "edgedetect=low=0.1:high=0.4" },
  cartoon: { label: "🎨 Cartoon", filtro: "edgedetect=mode=colormix:high=0" },
  comic: { label: "📖 Cómic", filtro: "edgedetect=mode=colormix:high=0.3,eq=saturation=1.8" },
  cine: { label: "🎬 Cinemático", filtro: "curves=preset=increase_contrast,eq=saturation=0.85" },
  pastel: { label: "🌺 Pastel", filtro: "eq=saturation=0.7:brightness=0.08" },
  intenso: { label: "🔥 Intenso", filtro: "eq=contrast=1.8:saturation=1.8:brightness=-0.05" },
  desaturado: { label: "🌅 Desaturado", filtro: "eq=saturation=0.3" },
  latido: { label: "💓 Latido", filtro: "zoompan=z='1+0.12*sin(2*PI*on/25)':d=1:s=512x512:fps=25", animado: true },
  rebote: { label: "🏀 Rebote", filtro: "crop=in_w:in_h-40:0:'20+20*sin(2*PI*t)'", animado: true },
  shake: { label: "🫨 Shake", filtro: "crop=in_w-24:in_h-24:'12+8*sin(18*t)':'12+8*cos(14*t)'", animado: true },
  girando: { label: "🌀 Girando", filtro: "rotate=2*PI*t/3:c=none:ow=rotw(0):oh=roth(0)", animado: true },
  arcoiris_anim: { label: "🌈 Arcoíris Animado", filtro: "hue=h=120*t:s=1.6", animado: true },
  pulso: { label: "✨ Pulso Brillante", filtro: "eq=brightness=0.22*sin(2*PI*t):saturation=1.4", animado: true },
  flash: { label: "🎇 Flash/Parpadeo", filtro: "eq=brightness=0.45*abs(sin(4*PI*t))", animado: true },
  glitch_anim: { label: "🔀 Glitch Animado", filtro: "noise=alls='20':allf=t,hue=h=40*sin(6*t)", animado: true },
  fade_anim: { label: "🌗 Aparece/Desaparece", filtro: "fade=in:0:12,fade=out:50:12:alpha=1", animado: true }
};

const CLAVES = Object.keys(EFECTOS);
const POR_PAGINA = 12;

// Recuerda a qué archivo le está aplicando efectos cada usuario
const pendientes = new Map(); // "chat:usuario" → { fileId, tipo, ext, ts }

function teclado(pagina, clave) {
  const inicio = pagina * POR_PAGINA;
  const trozo = CLAVES.slice(inicio, inicio + POR_PAGINA);
  const filas = [];

  for (let i = 0; i < trozo.length; i += 2) {
    filas.push(
      trozo.slice(i, i + 2).map((k) => ({
        text: EFECTOS[k].label,
        callback_data: `sks:${k}:${clave}`
      }))
    );
  }

  const total = Math.ceil(CLAVES.length / POR_PAGINA);
  const navegacion = [];
  if (pagina > 0) navegacion.push({ text: "⬅️ Antes", callback_data: `sks:pag${pagina - 1}:${clave}` });
  navegacion.push({ text: `${pagina + 1}/${total}`, callback_data: `sks:nada:${clave}` });
  if (pagina < total - 1) navegacion.push({ text: "Después ➡️", callback_data: `sks:pag${pagina + 1}:${clave}` });
  filas.push(navegacion);

  return { inline_keyboard: filas };
}

/** Aplica el efecto y devuelve el sticker listo para Telegram */
async function crearSticker(buffer, efecto, esVideo, ext) {
  const info = EFECTOS[efecto];
  const filtroBase = "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000";

  // Sin efecto y siendo imagen: se hace el webp directo (no necesita ffmpeg)
  if (!info.filtro && !esVideo) return { data: await imageToWebp(buffer), nombre: "sticker.webp" };

  const cadena = info.filtro ? `${info.filtro},${filtroBase}` : filtroBase;

  // Animado: siempre WEBM (VP9)
  if (esVideo || info.animado) {
    const args = [
      "-t", "2.9", "-an",
      "-c:v", "libvpx-vp9", "-b:v", "256k", "-crf", "42",
      "-vf", `${cadena},fps=24`,
      "-pix_fmt", "yuva420p", "-f", "webm"
    ];
    // Si la entrada es una foto hay que repetirla para que dure
    const previos = esVideo ? [] : ["-loop", "1"];
    const data = await ffmpeg(buffer, args, ext, "webm", previos);
    return { data, nombre: "sticker.webm" };
  }

  const data = await ffmpeg(buffer, ["-vcodec", "libwebp", "-vf", cadena, "-lossless", "0", "-q:v", "80"], ext, "webp");
  return { data, nombre: "sticker.webp" };
}

const handler = async (msg, { conn, usedPrefix, command }) => {
  const chatId = msg.chatId;
  const media = msg.media && msg.tipo !== "texto" ? msg.media : msg.quoted?.media;

  if (!media || !["imagen", "video", "gif", "sticker"].includes(media.tipo)) {
    return conn.sendMessage(chatId, {
      text:
        "🎨 *Creador de stickers con efectos*\n\n" +
        `Responde a una *foto*, *video* o *sticker* con *${usedPrefix}${command}*.\n\n` +
        `Tengo *${CLAVES.length} efectos*: blanco y negro, glitch, pixelado, girando, latido y muchos más.`
    }, { quoted: msg });
  }

  if (!hayFfmpeg()) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Falta ffmpeg en el servidor*, sin él no puedo aplicar efectos.\n\n_Puedes usar " + usedPrefix + "s para stickers normales._"
    }, { quoted: msg });
  }

  const clave = `${chatId}:${msg.senderId}`;
  pendientes.set(clave, {
    fileId: media.fileId,
    esVideo: ["video", "gif"].includes(media.tipo) || (media.tipo === "sticker" && media.animado),
    ext: media.ext || "mp4",
    ts: Date.now()
  });

  await conn.sendMessage(chatId, {
    text:
      `🎨 *Elige un efecto* (${CLAVES.length} disponibles)\n\n` +
      "_Toca un botón y te mando el sticker._",
    buttons: teclado(0, clave)
  }, { quoted: msg });
};

handler.command = ["sks", "stickerefecto"];

handler.iniciar = (conn) => {
  conn.onCallback("sks", async (query, datos) => {
    const [efecto, ...resto] = datos.split(":");
    const clave = resto.join(":");
    const chatId = query.message.chat.id;

    if (efecto === "nada") return conn.responderBoton(query.id);

    // Cambio de página del menú
    if (efecto.startsWith("pag")) {
      const pagina = parseInt(efecto.slice(3)) || 0;
      await conn.bot.editMessageReplyMarkup(teclado(pagina, clave), {
        chat_id: chatId,
        message_id: query.message.message_id
      }).catch(() => {});
      return conn.responderBoton(query.id);
    }

    const pendiente = pendientes.get(clave);
    if (!pendiente) {
      return conn.responderBoton(query.id, "⌛ Se venció este menú, vuelve a usar .sks", true);
    }
    if (!EFECTOS[efecto]) return conn.responderBoton(query.id, "❌ Efecto desconocido", true);

    // Solo quien pidió el menú puede usarlo
    if (!clave.endsWith(`:${query.from.id}`)) {
      return conn.responderBoton(query.id, "🚫 Este menú es de otra persona. Usa .sks tú también.", true);
    }

    await conn.responderBoton(query.id, `${EFECTOS[efecto].label} — procesando...`);

    try {
      const buffer = await conn.downloadMedia(pendiente.fileId);
      const { data, nombre } = await crearSticker(buffer, efecto, pendiente.esVideo, pendiente.ext);

      if (!data?.length) throw new Error("La conversión quedó vacía");
      if (nombre.endsWith(".webm") && data.length > 256 * 1024) {
        return conn.sendMessage(chatId, {
          text: "⚠️ El sticker animado quedó muy pesado. Prueba con un clip más corto."
        });
      }

      await conn.sendMessage(chatId, { sticker: data, fileName: nombre });
    } catch (e) {
      console.error("[sks]", e.message);
      await conn.sendMessage(chatId, {
        text: `❌ No pude aplicar *${EFECTOS[efecto].label}*.\n\n_${String(e.message).slice(0, 160)}_`
      });
    }
  });

  // Limpieza de menús viejos cada 10 minutos
  setInterval(() => {
    const limite = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of pendientes) if (v.ts < limite) pendientes.delete(k);
  }, 600000);
};

export default handler;
