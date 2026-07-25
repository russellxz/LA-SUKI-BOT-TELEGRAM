// plugins/Menu.js — Menú principal del bot
import fs from "fs";
import path from "path";

// Animación del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "video", url: "https://cdn.russellxz.click/770fe00e.mp4" };


const SETMENU = path.resolve("./setmenu.json");

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  const p = usedPrefix;
  await conn.react(chatId, msg.message_id, "🔥");

  // Menú personalizado del dueño (.setmenu)
  try {
    if (fs.existsSync(SETMENU)) {
      const data = JSON.parse(fs.readFileSync(SETMENU, "utf-8") || "{}");
      const propio = data.menu;
      if (propio?.texto || propio?.imagen) {
        if (propio.imagen) {
          return conn.sendMessage(chatId, { image: propio.imagen, caption: propio.texto || undefined }, { quoted: msg });
        }
        return conn.sendMessage(chatId, { text: propio.texto }, { quoted: msg });
      }
    }
  } catch {}

  const texto =
`╭━━━『 👑 *LA SUKI BOT* 』━━━◆
│ 🤖 Bot de Telegram
│ 🔣 Prefijos: ${global.prefixes.join("  ")}
│ 📦 Comandos: ${global.pluginIndex?.size || 0}
╰━━━━━━━━━━━━━━━━━━◆

ℹ️ *INFORMACIÓN*
╭─────◆
│ ${p}ping — velocidad
│ ${p}p — estado del servidor
│ ${p}speedtest — test de red
│ ${p}info — sobre el bot
│ ${p}creador — mi dueño
│ ${p}id — tu ID de Telegram
│ ${p}perfil — foto de perfil
╰─────◆

📚 *OTROS MENÚS*
╭─────◆
│ ${p}menugrupo — administrar grupos
│ ${p}menurpg — juego RPG
│ ${p}menuaudio — palabras guardadas
│ ${p}allmenu — TODOS los comandos
╰─────◆

🎨 *STICKERS*
╭─────◆
│ ${p}s — foto/video → sticker
│ ${p}sks — sticker con 54 efectos
│ ${p}toimg — sticker → imagen
│ ${p}tovideo — sticker → video
│ ${p}qc — texto → sticker de chat
│ ${p}aniemoji / ${p}mixemoji
│ ${p}guarsk / ${p}versk / ${p}sendsk
╰─────◆

📥 *DESCARGAS*
╭─────◆
│ ${p}play <nombre> — YouTube
│ ${p}ytmp3 / ${p}ytmp4
│ ${p}tiktok  ${p}instagram  ${p}facebook
│ ${p}twitter  ${p}spotify  ${p}mediafire
│ ${p}apk  ${p}pinterest  ${p}letra
│ ${p}yts — buscar en YouTube
╰─────◆

🤖 *INTELIGENCIA ARTIFICIAL*
╭─────◆
│ ${p}chatgpt <texto>
│ ${p}gemini <texto>
│ ${p}luminai <texto>
│ ${p}groq <texto>
│ ${p}imagen <texto> — buscar imagen
│ ${p}dalle / ${p}pixai — crear imagen
│ ${p}hd — mejorar calidad
│ ${p}toanime2 — foto a anime
│ ${p}tts <texto> — texto a voz
│ ${p}chat on/off — IA del grupo
╰─────◆

💾 *GUARDAR MULTIMEDIA*
╭─────◆
│ ${p}guar <palabra> — guardar
│ ${p}g <palabra> <n> — enviar
│ ${p}del <palabra> <n> — borrar
│ ${p}verpacks — ver paquetes
│ ${p}addco / ${p}delco — sticker con comando
╰─────◆

🎮 *DIVERSIÓN*
╭─────◆
│ ${p}ship  ${p}parejas  ${p}personalidad
│ ${p}kiss  ${p}slap  ${p}topkiss  ${p}topslap
│ ${p}verdad  ${p}reto  ${p}hackear
│ ${p}meme  ${p}mapas
│ ${p}4vs4 ... ${p}24vs24 — escuadras
╰─────◆

🛠️ *HERRAMIENTAS*
╭─────◆
│ ${p}tourl — subir archivo
│ ${p}toaudio  ${p}gifvideo
│ ${p}ff — optimizar video
│ ${p}ff2 — reparar audio
│ ${p}texto — texto en imagen
│ ${p}ver / ${p}get — reenviar o descargar
╰─────◆

💜 _Gracias por usar La Suki Bot_`;

  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    ...(MEDIA_MENU.tipo === "video" ? { gifPlayback: true } : {}),
    caption: texto
  }, { quoted: msg });
};

handler.command = ["menu", "menú", "help2", "comandos"];
export default handler;
