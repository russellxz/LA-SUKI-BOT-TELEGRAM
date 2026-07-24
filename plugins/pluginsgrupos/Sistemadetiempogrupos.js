// plugins/pluginsgrupos/Sistemadetiempogrupos.js
// Revisa cada 20 segundos si algún grupo tiene programada una apertura o un
// cierre (comandos .abrir y .cerrar) y lo aplica cuando llega la hora.
import fs from "fs";
import path from "path";

const ARCHIVO_ABRIR = path.resolve("tiempo_grupo.json");
const ARCHIVO_CERRAR = path.resolve("tiempogrupo2.json");
const INTERVALO = 20000;

function leer(archivo) {
  try {
    if (!fs.existsSync(archivo)) return {};
    return JSON.parse(fs.readFileSync(archivo, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function guardar(archivo, data) {
  try {
    fs.writeFileSync(archivo, JSON.stringify(data, null, 2));
  } catch {}
}

async function revisar(conn) {
  const ahora = Date.now();

  const pendientesAbrir = leer(ARCHIVO_ABRIR);
  let cambioAbrir = false;
  for (const [chatId, info] of Object.entries(pendientesAbrir)) {
    if (!info?.abrir || info.abrir > ahora) continue;
    delete pendientesAbrir[chatId];
    cambioAbrir = true;
    try {
      await conn.cerrarGrupo(chatId, false);
      await conn.sendMessage(chatId, { text: "🔓 *El grupo se abrió automáticamente.* ¡Ya pueden escribir!" });
    } catch (e) {
      console.log(`⚠️ No pude abrir ${chatId}: ${e.message}`);
    }
  }
  if (cambioAbrir) guardar(ARCHIVO_ABRIR, pendientesAbrir);

  const pendientesCerrar = leer(ARCHIVO_CERRAR);
  let cambioCerrar = false;
  for (const [chatId, info] of Object.entries(pendientesCerrar)) {
    if (!info?.cerrar || info.cerrar > ahora) continue;
    delete pendientesCerrar[chatId];
    cambioCerrar = true;
    try {
      await conn.cerrarGrupo(chatId, true);
      await conn.sendMessage(chatId, { text: "🔒 *El grupo se cerró automáticamente.* Solo los admins pueden escribir." });
    } catch (e) {
      console.log(`⚠️ No pude cerrar ${chatId}: ${e.message}`);
    }
  }
  if (cambioCerrar) guardar(ARCHIVO_CERRAR, pendientesCerrar);
}

const handler = {};

handler.iniciar = (conn) => {
  if (global.__tiempoGruposTimer) clearInterval(global.__tiempoGruposTimer);
  global.__tiempoGruposTimer = setInterval(() => {
    revisar(conn).catch((e) => console.log("⚠️ Tiempos de grupo:", e.message));
  }, INTERVALO);
  console.log("⏱️  Sistema de apertura/cierre programado activo");
};

export default handler;
