// plugins/pluginsgrupos/Cerrar.js — Programar el cierre del grupo
import fs from "fs";
import path from "path";
import { noEsGrupo, noEsAdmin, botNoPuede } from "../../libs/grupo.js";

const ARCHIVO = path.resolve("tiempogrupo2.json");

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;
  if (await botNoPuede(msg, conn, "can_restrict_members")) return;

  const m = String(args[0] || "").trim().match(/^(\d+)([smh])$/i);
  if (!m) {
    return conn.sendMessage(chatId, {
      text:
        "⏰ *Programar cierre del grupo*\n\n" +
        `Usa: *${usedPrefix}${command} 10s*, *${usedPrefix}${command} 30m* o *${usedPrefix}${command} 2h*\n\n` +
        `_Para cerrarlo ya mismo usa ${usedPrefix}cerrargrupo_`
    }, { quoted: msg });
  }

  const cantidad = parseInt(m[1], 10);
  const unidad = m[2].toLowerCase();
  const ms = unidad === "s" ? cantidad * 1000 : unidad === "m" ? cantidad * 60000 : cantidad * 3600000;

  let data = {};
  try {
    if (fs.existsSync(ARCHIVO)) data = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8"));
  } catch {}

  data[String(chatId)] = { cerrar: Date.now() + ms };
  fs.writeFileSync(ARCHIVO, JSON.stringify(data, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: `⏳ El grupo se cerrará automáticamente en *${cantidad}${unidad}*.`
  }, { quoted: msg });
};

handler.command = ["cerrar"];
export default handler;
