// plugins/Topslap.js — Ranking de cachetadas del grupo
import fs from "fs";
import path from "path";
import { noEsGrupo, mencion } from "../libs/grupo.js";

const DB = path.resolve("slap_data.json");

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  if (await noEsGrupo(msg, conn)) return;
  await conn.react(chatId, msg.message_id, "🖕");

  let db = {};
  try {
    if (fs.existsSync(DB)) db = JSON.parse(fs.readFileSync(DB, "utf-8") || "{}");
  } catch {}

  const grupo = db[String(chatId)];
  if (!grupo || !Object.keys(grupo).length) {
    return conn.sendMessage(chatId, {
      text: `📭 Todavía no hay cachetadas en este grupo.`
    }, { quoted: msg });
  }

  const orden = Object.entries(grupo).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const medallas = ["🥇", "🥈", "🥉"];

  await conn.sendMessage(chatId, {
    text:
      `🖕 *TOP CACHETADAS DEL GRUPO*\n\n` +
      orden.map(([id, n], i) => `${medallas[i] || `${i + 1}.`} ${mencion(id)} — *${n}*`).join("\n"),
    mentions: orden.map(([id]) => id)
  }, { quoted: msg });
};

handler.command = ["topslap", "topcachetadas"];
export default handler;
