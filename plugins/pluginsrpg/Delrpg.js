import fs from 'fs';
import path from 'path';


const handler = async (msg, { conn }) => {
  const chatId = msg.chatId;
  const sender = msg.senderId;
  const numero = sender.replace(/[^0-9]/g, "");

  const sukirpgPath = path.join(process.cwd(), "sukirpg.json");
  if (!fs.existsSync(sukirpgPath)) {
    return conn.sendMessage(chatId, {
      text: "❌ La base de datos RPG aún no existe.",
    }, { quoted: msg });
  }

  let db = JSON.parse(fs.readFileSync(sukirpgPath));
  db.usuarios = db.usuarios || [];
  db.personajes = db.personajes || [];
  db.banco = db.banco || null;

  const usuario = db.usuarios.find(u => u.numero === numero);
  if (!usuario) {
    return conn.sendMessage(chatId, {
      text: "❌ No estás registrado en el RPG. Usa `.rpg` para registrarte.",
    }, { quoted: msg });
  }

  // 🚫 NUEVO: bloquear si tiene deuda activa en el banco
  const tieneDeudaActiva = Array.isArray(db?.banco?.prestamos) && db.banco.prestamos.some(p => {
    if (String(p.numero) !== numero || p.estado !== "activo") return false;
    const prestadoBase = Number(p.cantidadSolicitada ?? p.cantidad ?? 0);
    const totalAPagar = Number.isFinite(p.totalAPagar) ? Number(p.totalAPagar) : Math.ceil(prestadoBase * 1.20);
    const pagado = Number(p.pagado || 0);
    const pendiente = Number.isFinite(p.pendiente) ? Number(p.pendiente) : Math.max(totalAPagar - pagado, 0);
    return pendiente > 0;
  });

  if (tieneDeudaActiva) {
    return conn.sendMessage(chatId, {
      text: "🏦 No puedes eliminar tu RPG porque tienes una *deuda activa* en el banco.\nPágala con *.pagarall* o espera a que el sistema la liquide.",
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    text:
      "⚠️ *¿Segur@ que quieres eliminar tu cuenta RPG?*\n\n" +
      "📝 Responde a este chat escribiendo:\n*si quiero*\n\n" +
      "_Tienes 2 minutos para confirmar._"
  }, { quoted: msg });

  // Esperamos la confirmación de esa misma persona
  const respuesta = await conn.esperarRespuesta(chatId, sender, 2 * 60 * 1000);

  if (!respuesta) {
    return conn.sendMessage(chatId, {
      text: "⏳ La solicitud de eliminación RPG expiró por inactividad."
    }, { quoted: msg });
  }

  if (String(respuesta.text || "").trim().toLowerCase() !== "si quiero") {
    return conn.sendMessage(chatId, {
      text: "❎ Cancelado. Tu cuenta RPG sigue intacta."
    }, { quoted: respuesta });
  }

  // Releemos la base por si cambió mientras esperábamos
  db = JSON.parse(fs.readFileSync(sukirpgPath));
  db.usuarios = db.usuarios || [];
  db.personajes = db.personajes || [];
  db.banco = db.banco || null;

  const deudaAhora = Array.isArray(db?.banco?.prestamos) && db.banco.prestamos.some(p => {
    if (String(p.numero) !== numero || p.estado !== "activo") return false;
    const prestadoBase = Number(p.cantidadSolicitada ?? p.cantidad ?? 0);
    const totalAPagar = Number.isFinite(p.totalAPagar) ? Number(p.totalAPagar) : Math.ceil(prestadoBase * 1.20);
    const pagado = Number(p.pagado || 0);
    const pendiente = Number.isFinite(p.pendiente) ? Number(p.pendiente) : Math.max(totalAPagar - pagado, 0);
    return pendiente > 0;
  });

  if (deudaAhora) {
    return conn.sendMessage(chatId, {
      text: "🏦 No puedes eliminar tu RPG: tienes una *deuda activa* en el banco.\nPágala con *.pagarall*."
    }, { quoted: respuesta });
  }

  const idx = db.usuarios.findIndex(u => u.numero === numero);
  if (idx === -1) {
    return conn.sendMessage(chatId, { text: "❌ No encontré tu perfil RPG." }, { quoted: respuesta });
  }

  // Los personajes vuelven a la tienda
  const user = db.usuarios[idx];
  if (user.personajes?.length) {
    for (const personaje of user.personajes) {
      db.personajes.push({
        nombre: personaje.nombre,
        imagen: personaje.imagen,
        precio: personaje.precio,
        nivel: personaje.nivel,
        habilidades: personaje.habilidades
      });
    }
  }

  db.usuarios.splice(idx, 1);
  fs.writeFileSync(sukirpgPath, JSON.stringify(db, null, 2));

  await conn.react(chatId, respuesta.message_id, "🗑️");
  await conn.sendMessage(chatId, {
    text: "✅ *Tu cuenta RPG fue eliminada.*\n\n🛒 Tus personajes volvieron a la tienda."
  }, { quoted: respuesta });
};

handler.command = ["delrpg"];
export default handler;
