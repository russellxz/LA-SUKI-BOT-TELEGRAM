// plugins/pluginsgrupos/Delwar.js — Borrar las advertencias del grupo
import fs from "fs";
import path from "path";
import { noEsGrupo, noEsAdmin, objetivoDe, mencion } from "../../libs/grupo.js";

const ADV_PATH = path.resolve("./advertencias.json");

const handler = async (msg, ctx) => {
  const { conn, args } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx)) return;

  if (!fs.existsSync(ADV_PATH)) {
    return conn.sendMessage(chatId, { text: "📁 No hay advertencias registradas aún." }, { quoted: msg });
  }

  let advertencias = {};
  try {
    advertencias = JSON.parse(fs.readFileSync(ADV_PATH, "utf-8"));
  } catch {}

  const chat = String(chatId);
  const objetivo = objetivoDe(msg, args);

  if (objetivo) {
    if (advertencias[chat]?.[objetivo.id]) {
      delete advertencias[chat][objetivo.id];
      fs.writeFileSync(ADV_PATH, JSON.stringify(advertencias, null, 2));
      return conn.sendMessage(chatId, {
        text: `✅ Le quité las advertencias a ${mencion(objetivo.id, objetivo.nombre)}.`
      }, { quoted: msg });
    }
    return conn.sendMessage(chatId, {
      text: `ℹ️ ${mencion(objetivo.id, objetivo.nombre)} no tiene advertencias.`
    }, { quoted: msg });
  }

  const cuantas = Object.keys(advertencias[chat] || {}).length;
  delete advertencias[chat];
  fs.writeFileSync(ADV_PATH, JSON.stringify(advertencias, null, 2));

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text: cuantas
      ? `✅ Borré las advertencias de *${cuantas}* usuario(s) en este grupo.`
      : "ℹ️ Este grupo no tenía advertencias."
  }, { quoted: msg });
};

handler.command = ["delwar", "delwarn", "borraradvertencias"];
export default handler;
