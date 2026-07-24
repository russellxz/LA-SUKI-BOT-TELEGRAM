// plugins/pluginsgrupos/Menugrupo.js — Menú de comandos de administración
const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  const p = usedPrefix;
  await conn.react(chatId, msg.message_id, "👮");

  const texto =
`╭━━━『 👮 *MENÚ DE GRUPOS* 』━━━◆
│ Prefijo actual: 「 ${p} 」
╰━━━━━━━━━━━━━━━━━━◆

🛡️ *MODERACIÓN*
╭─────◆
│ ${p}kick — expulsar
│ ${p}ban / ${p}unban — bloquear el bot
│ ${p}mute / ${p}unmute — silenciar
│ ${p}delete — borrar mensaje citado
│ ${p}daradmins / ${p}quitaradmins
│ ${p}delwar — borrar advertencias
╰─────◆

🔒 *PROTECCIONES*
╭─────◆
│ ${p}antilink on/off
│ ${p}linkall on/off
│ ${p}antis on/off
│ ${p}antiarabe on/off
│ ${p}antiarabe2 — limpiar
│ ${p}modoadmins on/off
╰─────◆

👋 *BIENVENIDAS*
╭─────◆
│ ${p}welcome on/off
│ ${p}despedidas on/off
│ ${p}setwelcome <texto>
│ ${p}setdespedidas <texto>
│ ${p}delwelcome
╰─────◆

⚙️ *AJUSTES DEL GRUPO*
╭─────◆
│ ${p}abrirgrupo / ${p}cerrargrupo
│ ${p}abrir 10m / ${p}cerrar 1h
│ ${p}setname <nombre>
│ ${p}setinfo <descripción>
│ ${p}setfoto (responde a una foto)
│ ${p}setreglas / ${p}reglas
│ ${p}linkgrupo
╰─────◆

📊 *INFORMACIÓN*
╭─────◆
│ ${p}infogrupo
│ ${p}configrupo
│ ${p}totalchat — ranking
│ ${p}fantasmas 10
│ ${p}fankick 10
│ ${p}restchat
│ ${p}id — ver IDs
╰─────◆

📢 *AVISOS*
╭─────◆
│ ${p}todos <mensaje>
│ ${p}tag <mensaje>
│ ${p}reacion on/off
╰─────◆

💡 *Recuerda:* para expulsar, silenciar o cerrar el grupo
necesito ser *administradora* con esos permisos.`;

  await conn.sendMessage(chatId, { text: texto }, { quoted: msg });
};

handler.command = ["menugrupo", "grupomenu", "menuadmin"];
export default handler;
