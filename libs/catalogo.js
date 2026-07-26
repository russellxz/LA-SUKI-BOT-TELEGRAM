/**
 * libs/catalogo.js — Todos los comandos, ordenados por categorías.
 *
 * De aquí salen el menú navegable (.menu), la lista completa (.allmenu) y los
 * menús sueltos (.menugrupo, .menurpg, .menuowner...). Al estar todo en un
 * sitio, si se añade un comando se toca un archivo y aparece en todos lados.
 *
 * Cada comando es [nombre, "para qué sirve"]. El nombre va sin prefijo.
 */

export const CATEGORIAS = {
  info: {
    emoji: "ℹ️",
    nombre: "Información",
    resumen: "Estado del bot y datos tuyos",
    comandos: [
      ["ping", "qué tan rápido responde"],
      ["p", "estado del servidor"],
      ["speedtest", "prueba de velocidad"],
      ["info", "sobre el bot"],
      ["creador", "quién me hizo"],
      ["id", "tu ID de Telegram"],
      ["perfil", "tu foto de perfil"],
      ["prefijo", "ver los prefijos activos"]
    ]
  },

  descargas: {
    emoji: "📥",
    nombre: "Descargas",
    resumen: "YouTube, TikTok, Instagram y más",
    comandos: [
      ["play", "busca y baja de YouTube"],
      ["ytmp3", "audio de YouTube"],
      ["ytmp4", "video de YouTube"],
      ["yts", "buscar en YouTube"],
      ["tiktok", "video sin marca de agua"],
      ["instagram", "fotos, reels y carruseles"],
      ["facebook", "videos de Facebook"],
      ["twitter", "videos e imágenes de X"],
      ["spotify", "canciones de Spotify"],
      ["mediafire", "archivos de MediaFire"],
      ["apk", "buscar y bajar apps"],
      ["pinvideo", "videos de Pinterest"],
      ["letra", "letra de una canción"]
    ]
  },

  stickers: {
    emoji: "🎨",
    nombre: "Stickers",
    resumen: "Crearlos, editarlos y guardarlos",
    comandos: [
      ["s", "foto o video → sticker"],
      ["sks", "sticker con 54 efectos"],
      ["toimg", "sticker → imagen"],
      ["tovideo", "sticker → video"],
      ["qc", "texto → sticker de cita"],
      ["aniemoji", "emoji animado"],
      ["mixemoji", "mezclar dos emojis"],
      ["guarsk", "guardar un sticker"],
      ["versk", "ver tus stickers"],
      ["sendsk", "enviar uno guardado"],
      ["delsk", "borrar uno guardado"]
    ]
  },

  ia: {
    emoji: "🤖",
    nombre: "Inteligencia artificial",
    resumen: "Chat, imágenes y voz",
    comandos: [
      ["chatgpt", "preguntarle a ChatGPT"],
      ["gemini", "preguntarle a Gemini"],
      ["luminai", "otra IA de chat"],
      ["groq", "IA rápida"],
      ["imagen", "buscar una imagen"],
      ["dalle", "crear una imagen"],
      ["pixai", "crear arte"],
      ["hd", "mejorar la calidad de una foto"],
      ["toanime2", "tu foto en anime"],
      ["tts", "texto a voz"],
      ["chat", "que la IA responda sola en el grupo"]
    ]
  },

  guardados: {
    emoji: "💾",
    nombre: "Multimedia guardada",
    resumen: "Guarda archivos con una palabra",
    comandos: [
      ["guar", "guardar el archivo citado"],
      ["g", "enviar uno concreto"],
      ["del", "borrar uno guardado"],
      ["verpacks", "ver todos los paquetes"],
      ["menuaudio", "lista de palabras guardadas"],
      ["addco", "poner un comando a un sticker"],
      ["delco", "quitarle el comando"],
      ["trag", "migrar el guar.json de WhatsApp"],
      ["trag2", "migrar el de otro bot"]
    ]
  },

  diversion: {
    emoji: "🎮",
    nombre: "Diversión",
    resumen: "Juegos y cosas para el grupo",
    comandos: [
      ["ship", "juntar a dos del grupo"],
      ["parejas", "formar parejas"],
      ["personalidad", "tu personalidad del día"],
      ["kiss", "dar un beso"],
      ["slap", "dar una cachetada"],
      ["topkiss", "ranking de besos"],
      ["topslap", "ranking de cachetadas"],
      ["verdad", "una verdad"],
      ["reto", "un reto"],
      ["hackear", "broma de hackeo"],
      ["meme", "un meme al azar"],
      ["mapas", "mapa para el versus"]
    ]
  },

  herramientas: {
    emoji: "🛠️",
    nombre: "Herramientas",
    resumen: "Convertir, subir y reenviar",
    comandos: [
      ["tourl", "subir un archivo y darte el enlace"],
      ["toaudio", "video → audio"],
      ["gifvideo", "gif → video"],
      ["ff", "optimizar un video"],
      ["ff2", "reparar el audio de un video"],
      ["texto", "poner tu texto en una imagen"],
      ["ver", "reenviar lo citado"],
      ["get", "descargar lo citado"],
      ["whatmusic", "qué canción suena"]
    ]
  },

  grupos: {
    emoji: "👮",
    nombre: "Grupos",
    resumen: "Moderación y bienvenidas",
    soloGrupo: true,
    comandos: [
      ["kick", "expulsar a alguien"],
      ["ban", "prohibirle usar el bot"],
      ["unban", "levantarle el castigo"],
      ["mute", "silenciar (admite tiempo)"],
      ["unmute", "devolverle la voz"],
      ["daradmins", "hacerlo administrador"],
      ["quitaradmins", "quitarle el admin"],
      ["antilink", "borrar invitaciones a otros grupos"],
      ["linkall", "borrar cualquier enlace"],
      ["antis", "cortar el spam de stickers"],
      ["antiarabe", "filtro anti árabe"],
      ["modoadmins", "solo los admins usan el bot"],
      ["welcome", "bienvenidas"],
      ["setwelcome", "personalizar la bienvenida"],
      ["despedidas", "despedidas"],
      ["setdespedidas", "personalizar la despedida"],
      ["abrirgrupo", "abrir el grupo"],
      ["cerrargrupo", "cerrarlo"],
      ["abrir", "programar la apertura"],
      ["cerrar", "programar el cierre"],
      ["setname", "cambiar el nombre"],
      ["setinfo", "cambiar la descripción"],
      ["setfoto", "cambiar la foto"],
      ["setreglas", "poner las reglas"],
      ["reglas", "ver las reglas"],
      ["linkgrupo", "enlace de invitación"],
      ["todos", "avisar a todos"],
      ["tag", "mencionar a todos"],
      ["totalchat", "ranking de mensajes"],
      ["fantasmas", "quién no escribe"],
      ["fankick", "sacar a los fantasmas"],
      ["infogrupo", "datos del grupo"],
      ["configrupo", "cómo está configurado"]
    ]
  },

  rpg: {
    emoji: "🎯",
    nombre: "RPG",
    resumen: "Economía, mascotas y batallas",
    comandos: [
      ["rpg", "registrarte para jugar"],
      ["menurpg", "todos los comandos del juego"],
      ["saldo", "tu dinero"],
      ["banco", "tu cuenta del banco"],
      ["minar", "ir a minar"],
      ["talar", "ir a talar"],
      ["cazar", "ir a cazar"],
      ["work", "trabajar"],
      ["robar", "robarle a alguien"],
      ["tiendaper", "comprar personajes"],
      ["tiendamas", "comprar mascotas"],
      ["batallauser", "retar a alguien"],
      ["batallamascota", "pelea de mascotas"],
      ["crearclan", "crear tu clan"],
      ["miclan", "ver tu clan"],
      ["topuser", "los más ricos"]
    ]
  },

  freefire: {
    emoji: "🔫",
    nombre: "Free Fire",
    resumen: "Versus y retos de clanes",
    comandos: [
      ["menufree", "el menú de Free Fire"],
      ["mapas", "sortear mapa"],
      ["reglas", "reglas del grupo"],
      ["4vs4", "armar un 4 contra 4"],
      ["6vs6", "armar un 6 contra 6"],
      ["12vs12", "armar un 12 contra 12"],
      ["16vs16", "armar un 16 contra 16"],
      ["20vs20", "armar un 20 contra 20"],
      ["24vs24", "armar un 24 contra 24"],
      ["guerr", "guerra de clanes"]
    ]
  },

  ventas: {
    emoji: "🛒",
    nombre: "Ventas",
    resumen: "Stock, pagos y facturas",
    comandos: [
      ["stock", "ver el stock"],
      ["setstock", "cambiar el stock"],
      ["pago", "métodos de pago"],
      ["setpago", "cambiar los datos de pago"],
      ["netflix", "cuentas de Netflix"],
      ["combos", "los combos"],
      ["addfactura", "apuntar una venta"],
      ["verfactura", "ver una factura"],
      ["sorteo", "hacer un sorteo"]
    ]
  },

  owner: {
    emoji: "👑",
    nombre: "Owner",
    resumen: "Solo para el dueño del bot",
    soloOwner: true,
    comandos: [
      ["addowner", "agregar otro dueño"],
      ["delowner", "quitar un dueño"],
      ["addlista", "dar acceso por privado"],
      ["dellista", "quitar ese acceso"],
      ["bc", "aviso a todos los chats"],
      ["bc2", "aviso solo a los grupos"],
      ["vergrupos", "en qué grupos estoy"],
      ["botname", "cambiar mi nombre"],
      ["botfoto", "cambiar mi foto"],
      ["setprefix", "cambiar los prefijos"],
      ["setmenu", "poner tu propio menú"],
      ["modoprivado", "que solo lo usen los dueños"],
      ["apagado", "apagarme en un chat"],
      ["re", "restringir un comando aquí"],
      ["unre", "liberarlo otra vez"],
      ["carga", "recargar los plugins"],
      ["rest", "reiniciarme"],
      ["git", "ver el repositorio"]
    ]
  }
};

/** Orden en el que salen los botones del menú */
export const ORDEN = [
  "descargas", "stickers", "ia", "guardados",
  "diversion", "herramientas", "grupos", "rpg",
  "freefire", "ventas", "info", "owner"
];

/** Cuántos comandos hay en total en el catálogo */
export const totalComandos = () =>
  Object.values(CATEGORIAS).reduce((n, c) => n + c.comandos.length, 0);

export default { CATEGORIAS, ORDEN, totalComandos };
