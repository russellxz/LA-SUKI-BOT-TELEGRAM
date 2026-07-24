// plugins/pluginsgrupos/Mute.js — Silenciar a un usuario en el grupo
//
// En Telegram el silencio es real: se le quita el permiso de escribir con la
// API. Además se guarda en la lista del grupo para que el bot le borre los
// mensajes si por algo pierde los permisos de admin.
import { noEsGrupo, noEsAdmin, botNoPuede, objetivoDe, comoIndicarUsuario, mencion, listaChat, agregarALista } from "../../libs/grupo.js";

/** "10m", "2h", "1d" → segundos */
function aSegundos(txt) {
  const m = String(txt || "").trim().match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  return u === "s" ? n : u === "m" ? n * 60 : u === "h" ? n * 3600 : n * 86400;
}

const handler = async (msg, ctx) => {
  const { conn, args, usedPrefix, command } = ctx;
  const chatId = msg.chatId;

  if (await noEsGrupo(msg, conn)) return;
  if (await noEsAdmin(msg, ctx, "⛔ *Solo administradores o dueños del bot pueden usar este comando.*")) return;

  const objetivo = objetivoDe(msg, args);
  if (!objetivo) {
    return conn.sendMessage(chatId, {
      text:
        "⚠️ *Responde o menciona al usuario que quieres mutear.*\n\n" +
        `Ejemplos:\n• *${usedPrefix}mute* (respondiendo)\n• *${usedPrefix}mute @usuario*\n• *${usedPrefix}mute @usuario 30m* (por tiempo)`
    }, { quoted: msg });
  }

  if (global.isOwner(objetivo.id)) {
    return conn.sendMessage(chatId, { text: "👑 No puedo silenciar al dueño del bot." }, { quoted: msg });
  }
  if (await conn.esAdmin(chatId, objetivo.id)) {
    return conn.sendMessage(chatId, { text: "⛔ No puedo silenciar a un administrador." }, { quoted: msg });
  }

  const segundos = args.map(aSegundos).find((s) => s > 0) || 0;

  agregarALista(chatId, "muted", objetivo.id);

  let nativo = false;
  if (await conn.botPuede(chatId, "can_restrict_members")) {
    try {
      await conn.silenciar(chatId, objetivo.id, segundos);
      nativo = true;
    } catch {}
  }

  await conn.react(chatId, msg.message_id, "✅");
  await conn.sendMessage(chatId, {
    text:
      `🔇 ${mencion(objetivo.id, objetivo.nombre)} fue *silenciado*` +
      (segundos ? ` por *${args.find((a) => aSegundos(a) > 0)}*` : "") + ".\n" +
      (nativo ? "" : "\n⚠️ _No soy admin, así que solo puedo borrarle los mensajes._\n") +
      `\nPara devolverle la voz: *${usedPrefix}unmute*`
  });
};

handler.command = ["mute", "silenciar"];
export default handler;
