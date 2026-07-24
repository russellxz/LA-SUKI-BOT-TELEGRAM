// plugins/pluginsgrupos/SistemaLimpieza.js
// Limpieza automática de la carpeta tmp cada 15 minutos, para que el disco del
// hosting no se llene con los archivos temporales de stickers y descargas.
import fs from "fs";
import path from "path";
import chalk from "chalk";

const RETENCION_MS = 5 * 60 * 1000;   // borra lo que tenga más de 5 minutos
const CADA_MS = 15 * 60 * 1000;       // se ejecuta cada 15 minutos
const CARPETAS = [path.resolve("./tmp"), path.resolve("./guar_media/.cache")];

function limpiar(carpeta) {
  let borrados = 0;
  let liberado = 0;
  if (!fs.existsSync(carpeta)) return { borrados, liberado };

  for (const nombre of fs.readdirSync(carpeta)) {
    if (nombre === ".gitkeep") continue;
    const ruta = path.join(carpeta, nombre);
    try {
      const info = fs.statSync(ruta);
      if (info.isDirectory()) continue;
      if (Date.now() - info.mtimeMs < RETENCION_MS) continue;
      liberado += info.size;
      fs.unlinkSync(ruta);
      borrados++;
    } catch {}
  }
  return { borrados, liberado };
}

const handler = {};

handler.iniciar = () => {
  const correr = () => {
    let total = 0;
    let bytes = 0;
    for (const carpeta of CARPETAS) {
      const r = limpiar(carpeta);
      total += r.borrados;
      bytes += r.liberado;
    }
    if (total) {
      console.log(chalk.gray(`🧹 Limpieza: ${total} archivos temporales borrados (${(bytes / 1048576).toFixed(1)} MB)`));
    }
  };

  if (global.__limpiezaTimer) clearInterval(global.__limpiezaTimer);
  global.__limpiezaTimer = setInterval(correr, CADA_MS);
  setTimeout(correr, 60000);
  console.log("🧹 Sistema de limpieza automática activo");
};

export default handler;
