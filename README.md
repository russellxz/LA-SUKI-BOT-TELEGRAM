# 👑 LA SUKI BOT — TELEGRAM

Bot de Telegram con sistema de plugins: administración de grupos, stickers, descargas, inteligencia artificial, RPG, economía y más.

**+300 plugins · +500 comandos · listo para Pterodactyl**

---

## 🚀 Instalación rápida

### 1. Crea tu bot en Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía `/newbot` y ponle nombre y usuario
3. Copia el token que te da (algo como `123456789:AAE...`)

### 2. Configúralo para grupos ⚠️ IMPORTANTE

Sin este paso el bot **solo verá los mensajes que empiecen con `/`**, y no funcionarán el antilink, las palabras guardadas ni los stickers con comando:

```
En @BotFather:
  /setprivacy  →  elige tu bot  →  Disable
```

Recomendado también:

```
/setjoingroups  →  Enable      (para que pueda entrar a grupos)
```

### 3. Instala y arranca

```bash
npm install
npm start
```

La primera vez, si no configuraste el token en una variable, el bot te lo pedirá por consola y lo guardará en `token.json`.

### 4. Hazte dueño del bot

Al arrancar sin dueños, la consola muestra algo así:

```
⚠️  Todavía no hay ningún dueño configurado.
   Escríbele al bot por privado:  .soyowner 483920
```

Le mandas ese comando al bot por privado y ya eres el dueño.
(También puedes poner tu ID directo en la variable `OWNER_ID`.)

---

## 🦖 Instalación en Pterodactyl

1. **Crea el servidor** con el egg de **NodeJS** (versión **20 o superior**).

2. **Sube los archivos** del bot (o clona el repositorio):
   ```bash
   git clone https://github.com/russellxz/LA-SUKI-BOT-TELEGRAM.git .
   ```

3. **Variables de arranque** (pestaña *Startup*):

   | Variable | Valor | ¿Obligatoria? |
   |---|---|---|
   | `BOT_TOKEN` | el token de @BotFather | ✅ sí |
   | `OWNER_ID` | tu ID de Telegram | recomendada |

   > Si tu egg no deja crear variables, el bot también lee el token de `token.json`.

4. **Comando de arranque:**
   ```
   npm start
   ```

5. **Dale a Start.** En la consola verás el banner y `✅ Bot en línea`.

### Detalles del hosting

- **No hace falta compilar nada nativo.** La base de datos es JSON puro y las imágenes usan `@napi-rs/canvas`, que trae binarios listos.
- **ffmpeg** es opcional: sin él funcionan los stickers de imagen y todo lo demás; solo se pierden los stickers animados y las conversiones de audio/video. Si tu egg lo permite:
  ```bash
  apt update && apt install -y ffmpeg
  ```
- **Un token = un bot.** Si arrancas dos servidores con el mismo token, Telegram devuelve error 409. El bot te avisa claramente si pasa.
- **Espacio en disco:** la carpeta `guar_media/` guarda copias de lo que se guarda con `.guar`. Se limpia sola cada 15 minutos de temporales (`tmp/`).

---

## 🔣 Prefijos

Por defecto el bot responde a **tres prefijos**:

```
.menu      #menu      /menu
```

- El `/` es el prefijo nativo de Telegram (el del menú de comandos de la app) y **siempre queda activo**.
- En grupos también funciona `/comando@TuBot`, que es como Telegram manda los comandos.

Para cambiarlos (solo el dueño):

```
.setprefix . # !        → deja activos . # ! y /
.setprefix 🔥 ✨         → sí, también valen emojis: 🔥menu
.setprefix reset        → vuelve a los de siempre
.setprefix              → muestra los actuales
```

Se aceptan símbolos y emojis (hasta 4 caracteres visibles). **No** se aceptan letras
ni números, porque entonces cualquier palabra suelta dispararía comandos.

El cambio es inmediato y se guarda en `prefijos.json`.

---

## 👑 Dueños y quién puede usar el bot

### Hacerte dueño la primera vez

Al arrancar sin dueños, la consola te da un código:

```
⚠️  Todavía no hay ningún dueño configurado.
   Escríbele al bot por privado:  .soyowner 483920
```

Le mandas ese comando **por privado** al bot y quedas registrado como dueño en
`owner.json`. El código solo sirve una vez: en cuanto hay un dueño, deja de existir.

### Agregar más dueños

Con el comando `.addowner`, de cualquiera de estas tres formas:

```
.addowner                    (respondiendo a un mensaje suyo)
.addowner @usuario
.addowner 123456789          (su ID; lo ve con .id)
```

Para quitarlo: `.delowner` (igual). No se puede quitar al único dueño que quede.

### Quién puede escribirle por privado

Por seguridad, **en privado el bot solo le responde a los dueños y a quien esté
en la lista de acceso**. Así, si alguien encuentra tu bot por su @usuario, no
puede usarlo por su cuenta. En los **grupos no aplica**: ahí responde a todos.

```
.addlista        (respondiendo, con @usuario o con su ID)  → le das acceso al privado
.dellista        → se lo quitas
.addlista        (sin nada) → muestra la lista completa
```

Los dueños siempre tienen acceso, estén o no en la lista.

> Si todavía no hay ningún dueño configurado, el filtro no se aplica: si no, no
> podrías mandar `.soyowner` para reclamar el bot.

### Otros controles de acceso

| Comando | Qué hace |
|---|---|
| `.modoprivado on` | Solo los dueños pueden usar el bot, también en grupos |
| `.apagado on` | Apaga el bot en ese chat (solo el dueño lo prende) |
| `.ban` / `.unban` | Prohíbe a alguien usar el bot en ese grupo |
| `.modoadmins on` | En ese grupo, solo los admins usan comandos |
| `.re` / `.unre` | Restringe un comando concreto en un chat |

---

## 📚 Comandos principales

Escribe `.menu` para el menú completo o `.allmenu` para la lista de todos.

### 👮 Grupos
| Comando | Qué hace |
|---|---|
| `.kick` | Expulsa (responde o menciona) |
| `.ban` / `.unban` | Prohíbe usar el bot |
| `.mute` / `.unmute` | Silencia (admite tiempo: `.mute @user 30m`) |
| `.daradmins` / `.quitaradmins` | Da o quita administrador |
| `.antilink on/off` | Borra invitaciones a otros grupos |
| `.linkall on/off` | Borra cualquier enlace |
| `.antis on/off` | Anti spam de stickers |
| `.modoadmins on/off` | Solo los admins usan el bot |
| `.welcome on/off` · `.setwelcome` | Bienvenidas con imagen |
| `.despedidas on/off` · `.setdespedidas` | Despedidas |
| `.abrirgrupo` / `.cerrargrupo` | Abre o cierra el grupo |
| `.abrir 10m` / `.cerrar 1h` | Programa apertura o cierre |
| `.setname` · `.setinfo` · `.setfoto` | Cambia datos del grupo |
| `.todos` · `.tag` | Menciona a todos |
| `.totalchat` · `.fantasmas 10` · `.fankick 10` | Actividad del grupo |
| `.configrupo` · `.infogrupo` · `.id` | Información |

### 👑 Owner
`.addowner` · `.delowner` · `.addlista` (acceso al privado) · `.dellista` · `.bc` · `.bc2` · `.vergrupos` · `.botname` · `.carga` · `.rest` · `.modoprivado` · `.apagado` · `.re` / `.unre` · `.setmenu` · `.git` · `.addco` / `.delco`

### 🎨 Stickers
`.s` (foto/video → sticker) · `.sks` (54 efectos con botones) · `.toimg` · `.tovideo` · `.qc` · `.aniemoji` · `.mixemoji` · `.guarsk` / `.versk` / `.sendsk` / `.delsk`

### 📥 Descargas
`.play` (con botones audio/video) · `.ytmp3` · `.ytmp4` · `.tiktok` · `.instagram` · `.facebook` · `.twitter` · `.spotify` · `.mediafire` · `.apk` · `.pinterest` · `.letra` · `.yts`

### 🤖 Inteligencia artificial
`.chatgpt` · `.gemini` · `.luminai` · `.groq` · `.imagen` · `.dalle` · `.pixai` · `.hd` · `.toanime2` · `.tts` · `.chat on/off` (la IA responde sola en el grupo)

### 💾 Guardar multimedia
| Comando | Qué hace |
|---|---|
| `.guar <palabra>` | Guarda el archivo al que respondes |
| *(escribir la palabra)* | El bot manda ese archivo |
| `.g <palabra> <n>` | Manda uno concreto |
| `.del <palabra> <n>` | Borra uno |
| `.verpacks` · `.menuaudio` | Ver lo guardado |
| `.addco <comando>` | Enlaza un sticker a un comando |
| `.delco` | Le quita el comando al sticker |
| `.trag <n>` | Migra el `guar.json` viejo de WhatsApp |

### 🎮 Juegos y RPG
`.rpg` · `.menurpg` · `.minar` · `.trabajar` · `.banco` · `.tiendaper` · `.batallauser` · `.crearclan` · `.ship` · `.parejas` · `.verdad` · `.reto` · `.hackear` · `.4vs4` … `.24vs24`

### 🛒 Ventas
`.setpago` · `.pago` · `.stock` · `.netflix` · `.combos` · `.addfactura` · `.verfactura` · `.sorteo`

---

## 🗂️ Estructura del proyecto

```
index.js              Núcleo: conexión, filtros y despacho de comandos
db.js                 Configuración por chat (JSON, sin dependencias nativas)
config.js             Listas de verdad/reto
libs/
  telegram.js         Adaptador conn: envíos, grupos, media, botones
  mensajes.js         Normaliza los mensajes que llegan de Telegram
  usuarios.js         Registro de usuarios y chats conocidos
  grupo.js            Verificaciones de grupo/admin/permisos
  descargas.js        Cliente de las APIs de descarga
  fuctions.js         Conversión de stickers y audio (ffmpeg/sharp)
  subir.js            Subida de archivos para las APIs que piden URL
  adminCheck.js       Permisos de owner y admin
plugins/              Todos los comandos, por categorías
database/             Datos generados (config, usuarios) — no se sube a git
```

### Cómo hacer un plugin nuevo

```js
// plugins/Hola.js
const handler = async (msg, { conn, text, usedPrefix, isAdmin, isOwner }) => {
  await conn.sendMessage(msg.chatId, {
    text: `¡Hola *${msg.senderName}*! Escribiste: ${text}`
  }, { quoted: msg });
};

handler.command = ["hola", "saludo"];
export default handler;
```

Guárdalo en `plugins/` y usa `.carga` para recargar sin reiniciar.

Opcionales:
- `handler.all = async (msg, ctx) => {}` → se ejecuta con **todos** los mensajes
- `handler.iniciar = (conn) => {}` → se ejecuta una vez al arrancar (para tareas o botones)

---

## ⚠️ Diferencias con la versión de WhatsApp

Telegram no es WhatsApp, así que algunas cosas cambian:

| Antes (WhatsApp) | Ahora (Telegram) |
|---|---|
| Se conectaba con QR o código de 8 dígitos | Token de @BotFather |
| Subbots (`.serbot`, `.code`) | ❌ Eliminados: Telegram no los necesita, cada quien crea su bot gratis en 1 minuto |
| Panel web (`webserver.js`) | ❌ Eliminado |
| `.antidelete` | ❌ No es posible: Telegram **no avisa a los bots** cuando alguien borra un mensaje |
| Comandos de LID (`.mylid`, `.sacarlid`) | ➡️ Reemplazados por `.id` (IDs de Telegram) |
| `.pais` (expulsar por prefijo telefónico) | ❌ Los bots no ven números de teléfono |
| Anti árabe por prefijo telefónico | ➡️ Ahora detecta el alfabeto árabe en el nombre |
| Listar todos los miembros del grupo | ⚠️ La Bot API solo deja listar administradores. El bot va aprendiendo a la gente conforme escribe, y de ahí salen `.todos`, `.fantasmas` y `.totalchat` |
| Foto de perfil del bot por comando | ⚠️ Solo desde @BotFather (`/setuserpic`). El nombre y la descripción sí se cambian con `.botname` y `.botfoto` |
| Stickers WEBP con metadatos | ➡️ WEBP 512×512 (estáticos) y WEBM (animados, máx 3s) |

---

## 🔧 Problemas comunes

**El bot no responde en el grupo**
→ Falta desactivar la privacidad: `@BotFather → /setprivacy → Disable`. Después sácalo y vuelve a meterlo al grupo.

**No puede expulsar / silenciar / cerrar el grupo**
→ Tiene que ser **administrador** con esos permisos. El bot te dice exactamente cuál le falta.

**"Hay OTRA instancia del bot usando el mismo token"**
→ Estás corriendo el bot dos veces. Apaga una.

**No funcionan los stickers animados ni `.toaudio`**
→ Falta `ffmpeg` en el servidor.

**No puedo quitarle admin a alguien**
→ Telegram solo deja quitar admin a quien fue ascendido por el propio bot.

---

## 📜 Créditos

- Creador: **Russell** (russellxz) — [YouTube](https://youtube.com/@skyultraplus)
- Versión de Telegram del bot que antes corría en WhatsApp con Baileys.

Licencia ISC.
