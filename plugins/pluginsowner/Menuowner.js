// plugins/pluginsowner/Menuowner.js — Menú de comandos del dueño
import fs from "fs";
import path from "path";

const ARCHIVO = path.resolve("./setmenu.json");

const handler = async (msg, ctx) => {
  const { conn, usedPrefix, isOwner } = ctx;
  const chatId = msg.chatId;

  if (!isOwner) {
    return conn.sendMessage(chatId, { text: "⛔ *Este menú es solo para los dueños del bot.*" }, { quoted: msg });
  }

  await conn.react(chatId, msg.message_id, "👑");

  // Menú personalizado con .setmenuowner
  try {
    if (fs.existsSync(ARCHIVO)) {
      const data = JSON.parse(fs.readFileSync(ARCHIVO, "utf-8") || "{}");
      const propio = data.menuowner;
      if (propio?.texto || propio?.imagen) {
        if (propio.imagen) {
          return conn.sendMessage(chatId, { image: propio.imagen, caption: propio.texto || undefined }, { quoted: msg });
        }
        return conn.sendMessage(chatId, { text: propio.texto }, { quoted: msg });
      }
    }
  } catch {}

  const p = usedPrefix;
  const texto =
`╭━━━『 👑 *MENÚ OWNER* 』━━━◆
│ Dueños registrados: ${global.owner.length}
╰━━━━━━━━━━━━━━━━━━◆

👑 *DUEÑOS*
╭─────◆
│ ${p}addowner — agregar dueño
│ ${p}delowner — quitar dueño
│ ${p}addlista — permitir privado
│ ${p}dellista — quitar permiso
╰─────◆

🤖 *EL BOT*
╭─────◆
│ ${p}botname <nombre>
│ ${p}botfoto — foto y descripción
│ ${p}carga — recargar plugins
│ ${p}rest — reiniciar
│ ${p}git <comando> — ver el código
╰─────◆

🔒 *CONTROL*
╭─────◆
│ ${p}modoprivado on/off
│ ${p}apagado on/off — apagar aquí
│ ${p}re <comando> — restringir
│ ${p}unre <comando> — liberar
│ ${p}autoadmins — darte admin
╰─────◆

📢 *DIFUSIÓN*
╭─────◆
│ ${p}bc <mensaje> — a los grupos
│ ${p}bc2 <mensaje> — a los privados
│ ${p}vergrupos — mis grupos
╰─────◆

🎨 *MENÚS*
╭─────◆
│ ${p}setmenu / ${p}delmenu
│ ${p}setmenugrupo / ${p}delmenugrupo
│ ${p}setmenuowner / ${p}delmenuowner
╰─────◆

🎯 *STICKERS CON COMANDO*
╭─────◆
│ ${p}addco <comando> — enlazar
│ ${p}delco — desenlazar
╰─────◆`;

  await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["menuowner", "ownermenu"];
export default handler;
