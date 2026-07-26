// plugins/Menu.js — Menú principal, navegable con botones
//
// Llega UNA tarjeta con la portada animada y los botones de cada categoría.
// Al tocar una categoría, la misma tarjeta se edita y muestra esos comandos:
// no se manda ningún mensaje nuevo, así el chat no se llena.
//
// Los comandos van en `código`, que en Telegram se copia con solo tocarlo.
import fs from "fs";
import path from "path";
import { CATEGORIAS, ORDEN } from "../libs/catalogo.js";
import { cita, citaPlegable } from "../libs/estilo.js";

// Animación del menú (la misma que usaba el bot de WhatsApp)
const MEDIA_MENU = { tipo: "video", url: "https://cdn.russellxz.click/770fe00e.mp4" };

const SETMENU = path.resolve("./setmenu.json");

/** Portada: lo que se ve al escribir .menu */
function portada(p) {
  return [
    "👑 *LA SUKI BOT*",
    "_El bot más completo de Telegram_",
    "",
    cita([
      `🔣 Prefijos: ${global.prefixes.join("  ")}`,
      `📦 Comandos: ${global.pluginIndex?.size || 0}`,
      `🧩 Plugins: ${global.plugins?.length || 0}`
    ]),
    "",
    "👇 *Toca una categoría para ver sus comandos*",
    "",
    `_También tienes_ \`${p}allmenu\` _con la lista completa_`
  ].join("\n");
}

/** Una categoría abierta */
function pagina(clave, p) {
  const cat = CATEGORIAS[clave];
  if (!cat) return null;

  // El comando va en `código`: en Telegram se copia con solo tocarlo
  const filas = cat.comandos.map(([c, d]) => `\`${p}${c}\` — ${d}`);

  return [
    `${cat.emoji} *${cat.nombre.toUpperCase()}*`,
    `_${cat.resumen}_`,
    "",
    // Si son muchos, se pliegan para no tapar toda la pantalla
    filas.length > 14 ? citaPlegable(filas) : cita(filas),
    "",
    cat.soloGrupo ? "_Solo funcionan dentro de un grupo_" : "",
    cat.soloOwner ? "_Solo los dueños del bot pueden usarlos_" : "",
    `📦 *${cat.comandos.length}* comandos aquí`
  ].filter(Boolean).join("\n");
}

/** Botones de las categorías, de dos en dos */
function botonesPortada() {
  const filas = [];
  for (let i = 0; i < ORDEN.length; i += 2) {
    filas.push(
      ORDEN.slice(i, i + 2).map((k) => ({
        text: `${CATEGORIAS[k].emoji} ${CATEGORIAS[k].nombre}`,
        callback_data: `menu:${k}`
      }))
    );
  }
  return { inline_keyboard: filas };
}

/** Botones cuando estás dentro de una categoría */
function botonesCategoria(clave) {
  const i = ORDEN.indexOf(clave);
  const anterior = ORDEN[(i - 1 + ORDEN.length) % ORDEN.length];
  const siguiente = ORDEN[(i + 1) % ORDEN.length];

  return {
    inline_keyboard: [
      [
        { text: `◀️ ${CATEGORIAS[anterior].emoji}`, callback_data: `menu:${anterior}` },
        { text: "🏠 Inicio", callback_data: "menu:inicio" },
        { text: `${CATEGORIAS[siguiente].emoji} ▶️`, callback_data: `menu:${siguiente}` }
      ]
    ]
  };
}

const handler = async (msg, { conn, usedPrefix }) => {
  const chatId = msg.chatId;
  const p = usedPrefix;
  await conn.react(chatId, msg.message_id, "🔥");

  // Menú personalizado del dueño (.setmenu): se manda el suyo tal cual
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

  await conn.sendMessage(chatId, {
    [MEDIA_MENU.tipo]: MEDIA_MENU.url,
    ...(MEDIA_MENU.tipo === "video" ? { gifPlayback: true } : {}),
    caption: portada(p)
  }, { quoted: msg, buttons: botonesPortada() });
};

handler.command = ["menu", "menú", "help2", "comandos"];

handler.iniciar = (conn) => {
  conn.onCallback("menu", async (query, datos) => {
    const clave = String(datos || "").trim();
    const chatId = query.message?.chat?.id;
    const mensajeId = query.message?.message_id;
    if (!chatId || !mensajeId) return conn.responderBoton(query.id);

    const p = global.prefixes?.[0] || ".";

    if (clave === "inicio") {
      await conn.responderBoton(query.id, "🏠 Inicio");
      return conn.editar(chatId, mensajeId, portada(p), {
        esMedia: true,
        buttons: botonesPortada()
      });
    }

    const texto = pagina(clave, p);
    if (!texto) return conn.responderBoton(query.id, "🤔 Esa categoría ya no existe.", true);

    await conn.responderBoton(query.id, `${CATEGORIAS[clave].emoji} ${CATEGORIAS[clave].nombre}`);
    return conn.editar(chatId, mensajeId, texto, {
      esMedia: true,
      buttons: botonesCategoria(clave)
    });
  });
};

export default handler;
