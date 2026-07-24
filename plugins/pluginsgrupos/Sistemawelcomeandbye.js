/**
 * plugins/pluginsgrupos/Sistemawelcomeandbye.js
 *
 * Bienvenidas, despedidas y avisos de admin.
 * Se engancha a los eventos que dispara el núcleo:
 *   entrada   → alguien entró al grupo
 *   salida    → alguien salió o fue expulsado
 *   ascenso   → le dieron admin a alguien
 *   descenso  → le quitaron admin a alguien
 *   solicitud → alguien pidió entrar (filtro anti árabe)
 *
 * La imagen se arma con @napi-rs/canvas (no necesita librerías del sistema,
 * así funciona en cualquier hosting tipo Pterodactyl).
 */

import fs from "fs";
import path from "path";
import { getConfig } from "../../db.js";
import { nombreDe } from "../../libs/usuarios.js";

const ESTADO_PATH = path.resolve("setwelcome.json");

const FONDO_BIENVENIDA = "https://cdn.russellxz.click/7177383b.jpg";
const FONDO_DESPEDIDA = "https://cdn.russellxz.click/bc842c44.jpg";
const AVATAR_POR_DEFECTO = "https://cdn.russellxz.click/e6a86d0f.jpg";

const RE_ARABE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

const MENSAJES_BIENVENIDA = [
  "🌟 ¡Bienvenid@ al grupo! Esperamos que la pases de lo mejor 🎉",
  "🎈 ¡Hola hola! Gracias por unirte, disfruta tu estadía ✨",
  "✨ ¡Nuevo miembro ha llegado! Que empiece la fiesta 🎊",
  "😯 ¡Hey! Te damos la bienvenida con los brazos abiertos 🤗",
  "💥 ¡Un guerrero más se une a la aventura! Bienvenid@ 😎"
];

const MENSAJES_DESPEDIDA = [
  "😈 ¡Adiós! Esperamos verte de nuevo.",
  "😆 Se ha ido un miembro. ¡Buena suerte!",
  "🚪 Alguien ha salido del grupo. ¡Hasta luego!",
  "📤 Un compañero ha partido, ¡le deseamos lo mejor!",
  "💨 Se ha ido volando... ¡Bye bye!"
];

const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];

function leerEstado() {
  try {
    if (!fs.existsSync(ESTADO_PATH)) return {};
    return JSON.parse(fs.readFileSync(ESTADO_PATH, "utf-8") || "{}");
  } catch {
    return {};
  }
}

const activo = (valor) => {
  const v = String(valor ?? "").trim().toLowerCase();
  return v === "1" || v === "on" || v === "true" || v === "si" || v === "sí";
};

/**
 * Reemplaza las etiquetas del texto personalizado:
 *   @user / {user}   → mención del usuario
 *   {nombre}         → su nombre
 *   {grupo}          → nombre del grupo
 *   {total}          → miembros del grupo
 */
function armarTexto(plantilla, datos) {
  return String(plantilla)
    .replace(/@user\b/gi, datos.mencion)
    .replace(/\{user\}/gi, datos.mencion)
    .replace(/\{nombre\}/gi, datos.nombre)
    .replace(/\{grupo\}/gi, datos.grupo)
    .replace(/\{total\}/gi, String(datos.total));
}

/** Arma la tarjeta con la foto de perfil; si algo falla, devuelve null */
async function crearTarjeta(conn, user, chatId, tipo) {
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");

    const urlAvatar = (await conn.profilePictureUrl(user.id)) || AVATAR_POR_DEFECTO;
    const [avatar, fondo] = await Promise.all([
      loadImage(urlAvatar).catch(() => loadImage(AVATAR_POR_DEFECTO)),
      loadImage(tipo === "entrada" ? FONDO_BIENVENIDA : FONDO_DESPEDIDA)
    ]);

    const canvas = createCanvas(1080, 720);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

    // Avatar redondo con borde
    const x = 65, y = 65, tam = 170;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + tam / 2, y + tam / 2, tam / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, tam, tam);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x + tam / 2, y + tam / 2, tam / 2, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = tipo === "entrada" ? "#6ee7b7" : "#fca5a5";
    ctx.stroke();

    // Nombre
    const nombre = nombreDe(user).slice(0, 22);
    ctx.font = "bold 54px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText(nombre, x + tam + 40, y + 90);

    ctx.font = "36px sans-serif";
    ctx.fillStyle = tipo === "entrada" ? "#a7f3d0" : "#fecaca";
    ctx.fillText(tipo === "entrada" ? "¡Bienvenid@!" : "Se despidió", x + tam + 40, y + 145);

    return canvas.toBuffer("image/png");
  } catch (e) {
    console.log("⚠️ No pude generar la imagen de bienvenida:", e.message);
    return null;
  }
}

async function enviarAviso(conn, { chatId, user, chat }, tipo) {
  const clave = tipo === "entrada" ? "welcome" : "despedidas";
  if (!activo(getConfig(chatId, clave))) return;

  const estado = leerEstado();
  const personalizado = estado[String(chatId)]?.[tipo === "entrada" ? "bienvenida" : "despedida"];

  let total = 0;
  try {
    total = await conn.bot.getChatMemberCount(chatId);
  } catch {}

  const datos = {
    mencion: `@${user.id}`,
    nombre: nombreDe(user),
    grupo: chat?.title || "el grupo",
    total
  };

  const base = personalizado
    ? armarTexto(personalizado, datos)
    : `${alAzar(tipo === "entrada" ? MENSAJES_BIENVENIDA : MENSAJES_DESPEDIDA)}\n\n` +
      `👤 ${datos.mencion}\n` +
      `📍 ${datos.grupo}\n` +
      (total ? `👥 Ahora somos *${total}* miembros` : "");

  const imagen = await crearTarjeta(conn, user, chatId, tipo);

  if (imagen) {
    await conn.sendMessage(chatId, { image: imagen, caption: base, mentions: [user.id] }).catch(() => {});
  } else {
    await conn.sendMessage(chatId, { text: base, mentions: [user.id] }).catch(() => {});
  }
}

/** Filtro anti árabe: expulsa a quien entre con el nombre en alfabeto árabe */
async function filtroArabe(conn, { chatId, user }) {
  if (!activo(getConfig(chatId, "antiarabe"))) return false;
  if (!RE_ARABE.test(nombreDe(user))) return false;
  if (global.isOwner(user.id)) return false;
  if (!(await conn.botPuede(chatId, "can_restrict_members"))) return false;

  try {
    await conn.kick(chatId, user.id);
    await conn.sendMessage(chatId, {
      text: `🚫 *${nombreDe(user)}* fue expulsado automáticamente (filtro anti árabe activo).`
    });
    return true;
  } catch {
    return false;
  }
}

const handler = {};

handler.iniciar = (conn) => {
  if (!conn?.ev || handler.__listo) return;
  handler.__listo = true;

  conn.ev.on("entrada", async (evento) => {
    try {
      if (await filtroArabe(conn, evento)) return;
      await enviarAviso(conn, evento, "entrada");
    } catch (e) {
      console.log("⚠️ Bienvenida:", e.message);
    }
  });

  conn.ev.on("salida", async (evento) => {
    try {
      await enviarAviso(conn, evento, "salida");
    } catch (e) {
      console.log("⚠️ Despedida:", e.message);
    }
  });

  conn.ev.on("ascenso", async ({ chatId, user, autor }) => {
    try {
      await conn.sendMessage(chatId, {
        text:
          "╭──『 👑 *NUEVO ADMIN* 』─◆\n" +
          `│ 👤 Usuario: @${user.id}\n` +
          `│ ✅ Ascendido por: ${autor ? `@${autor.id}` : "el grupo"}\n` +
          "╰────────────────────◆",
        mentions: [user.id, autor?.id].filter(Boolean)
      });
    } catch {}
  });

  conn.ev.on("descenso", async ({ chatId, user, autor }) => {
    try {
      await conn.sendMessage(chatId, {
        text:
          "╭──『 📉 *ADMIN DEGRADADO* 』─◆\n" +
          `│ 👤 Usuario: @${user.id}\n` +
          `│ ❌ Degradado por: ${autor ? `@${autor.id}` : "el grupo"}\n` +
          "╰────────────────────◆",
        mentions: [user.id, autor?.id].filter(Boolean)
      });
    } catch {}
  });

  // Solicitudes de ingreso: se rechazan automáticamente si el filtro está activo
  conn.ev.on("solicitud", async ({ chatId, user }) => {
    try {
      if (!activo(getConfig(chatId, "antiarabe"))) return;
      if (!RE_ARABE.test(nombreDe(user))) return;
      await conn.bot.declineChatJoinRequest(chatId, user.id);
      console.log(`🚫 Solicitud rechazada de ${nombreDe(user)} (filtro anti árabe)`);
    } catch {}
  });

  console.log("👋 Sistema de bienvenidas y despedidas activo");
};

export default handler;
