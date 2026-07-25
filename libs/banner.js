/**
 * libs/banner.js — Presentación del bot en la consola.
 *
 * Dibuja el nombre en letras grandes con un degradado de colores que se va
 * moviendo, igual que se veía en el hosting con la versión de WhatsApp.
 * Si la consola no admite colores (o se está guardando el log en un archivo),
 * se imprime una sola vez, sin animación, para no ensuciar el registro.
 */

import { Chalk } from "chalk";
import figlet from "figlet";

// Los paneles de hosting (Pterodactyl, Railway...) sí pintan colores aunque
// Node no los detecte, así que se fuerzan.
const chalk = new Chalk({ level: 3 });

/** ¿Estamos en una consola que pinta colores y mueve el cursor? */
const consolaBonita = () =>
  Boolean(process.stdout.isTTY || process.env.P_SERVER_UUID || process.env.PTERODACTYL || process.env.FORCE_COLOR);

/** Colores del degradado (morado → rosa → celeste, los de La Suki) */
const COLORES = [
  [168, 85, 247],
  [217, 70, 239],
  [236, 72, 153],
  [244, 114, 182],
  [96, 165, 250],
  [56, 189, 248],
  [34, 211, 238]
];

/** Mezcla dos colores */
function mezclar(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

/** Color del degradado en una posición (0 a 1), desplazado por `offset` */
function colorEn(posicion, offset = 0) {
  const p = (posicion + offset) % 1;
  const escala = p * (COLORES.length - 1);
  const i = Math.floor(escala);
  return mezclar(COLORES[i], COLORES[Math.min(i + 1, COLORES.length - 1)], escala - i);
}

/** Pinta un texto con el degradado, línea por línea */
function pintar(texto, offset = 0) {
  return texto
    .split("\n")
    .map((linea) => {
      const largo = Math.max(linea.length, 1);
      return [...linea]
        .map((letra, i) => {
          if (letra === " ") return letra;
          const [r, g, b] = colorEn(i / largo, offset);
          return chalk.rgb(r, g, b)(letra);
        })
        .join("");
    })
    .join("\n");
}

/**
 * Muestra el banner animado.
 * @param {string} titulo  texto en letras grandes
 * @param {string} subtitulo  línea de abajo
 * @param {object} opciones  { animar, vueltas, velocidad }
 */
export async function mostrarBanner(titulo = "La Suki Bot", subtitulo = "💜 Versión Telegram 💜", opciones = {}) {
  const {
    animar = consolaBonita(),
    vueltas = 14,
    velocidad = 90
  } = opciones;

  let arte;
  try {
    arte = figlet.textSync(titulo, { font: "Standard" });
  } catch {
    arte = titulo;
  }

  if (!animar) {
    console.log(pintar(arte, 0));
    console.log(chalk.magentaBright(`           ${subtitulo}\n`));
    return;
  }

  const alto = arte.split("\n").length + 2;

  for (let paso = 0; paso < vueltas; paso++) {
    // Se sube el cursor para repintar encima (así se ve el movimiento)
    if (paso > 0) process.stdout.write(`\x1b[${alto}A`);

    process.stdout.write(pintar(arte, paso / vueltas) + "\n");

    const [r, g, b] = colorEn(0.5, paso / vueltas);
    process.stdout.write(chalk.rgb(r, g, b)(`           ${subtitulo}`) + "\n\n");

    await new Promise((resolve) => setTimeout(resolve, velocidad));
  }
}

/** Línea de sección con color, para el resto de los avisos del arranque */
export function seccion(texto, color = "magenta") {
  const linea = "─".repeat(Math.max(4, 46 - texto.length));
  return chalk[color](`\n╭─ ${chalk.bold(texto)} ${linea}`);
}

export default { mostrarBanner, seccion };
