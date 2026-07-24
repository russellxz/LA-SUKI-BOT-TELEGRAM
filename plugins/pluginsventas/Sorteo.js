// plugins/sorteo.js
const DIGITS = (s = "") => String(s).replace(/\D/g, "");

function lidParser(participants = []) {
  try {
    return participants.map(v => ({
      id: (typeof v?.id === "string" && v.id.length > 0 && v.jid) ? v.jid : v.id,
      admin: v?.admin ?? null,
      raw: v
    }));
  } catch {
    return participants || [];
  }
}

function resolveRealFromId(id, partsRaw, partsNorm) {
  if (typeof id !== "string") return null;
  if (id.length > 0) return id;
  if (!id.length > 0) return null;

  const idx = partsRaw.findIndex(p => p?.id === id);
  if (idx >= 0) {
    const r = partsRaw[idx];
    if (typeof r?.jid === "string" && r.jid.length > 0) return r.jid;
    const maybe = partsNorm[idx]?.id;
    if (typeof maybe === "string" && maybe.length > 0) return maybe;
  }
  const hit = partsNorm.find(n => n?.raw?.id === id && typeof n?.id === "string" && n.id.length > 0);
  return hit ? hit.id : null;
}

/** ¿El número es admin? (considera LID y no-LID) */
function getAdminNumbers(partsRaw, partsNorm) {
  const adminNums = new Set();
  for (let i = 0; i < partsRaw.length; i++) {
    const r = partsRaw[i], n = partsNorm[i];
    const isAdm = (r?.admin === "admin" || r?.admin === "superadmin" ||
                   n?.admin === "admin" || n?.admin === "superadmin");
    if (isAdm) {
      [r?.id, r?.jid, n?.id].forEach(x => {
        const d = DIGITS(x || "");
        if (d) adminNums.add(d);
      });
    }
  }
  return adminNums;
}

const handler = async (msg, { conn, args }) => {
  const chatId   = msg.chatId;
  const isGroup  = msg.isGroup;
  const senderId = msg.senderId;
  const senderNo = DIGITS(senderId);
  const isFromMe = !!false;

  if (!isGroup) {
    return conn.sendMessage(chatId, { text: "❌ Este comando solo puede usarse en grupos." }, { quoted: msg });
  }

  // Texto del premio (permite espacios)
  const text = (args || []).join(" ").trim();
  if (!text) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa el comando así:\n\n*.sorteo [premio o motivo]*\nEjemplo:\n*.sorteo Carro Fino*`
    }, { quoted: msg });
  }

  // Metadata y normalización LID
  const meta     = await conn.groupMetadata(chatId);
  const partsRaw = Array.isArray(meta?.participants) ? meta.participants : [];
  const partsNorm = lidParser(partsRaw);

  // Bot JID / número real
  const botNo  = DIGITS(conn.user?.id || "");
  const botJid = String(botNo);

  // ¿Sender es admin / owner?
  const adminNums = getAdminNumbers(partsRaw, partsNorm);
  const isAdmin   = adminNums.has(senderNo);
  const isOwner   = (typeof global.isOwner === "function")
    ? (global.isOwner(senderNo) || global.isOwner(String(senderNo)))
    : (Array.isArray(global.owner) && global.owner.some(([id]) => id === senderNo));

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo *admins* o *el dueño del bot* pueden usar este comando."
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { react: { text: '🎲', key: msg.key } });

  // Construir lista de participantes elegibles:
  // - ID de Telegram
  // - excluir admins
  // - excluir el bot
  const elegibles = [];
  for (let i = 0; i < partsRaw.length; i++) {
    const realId = partsNorm[i]?.id || resolveRealFromId(partsRaw[i]?.id, partsRaw, partsNorm) || partsRaw[i]?.jid || partsRaw[i]?.id;
    if (!realId || !realId.length > 0) continue;

    const num = DIGITS(realId);
    const esAdmin = adminNums.has(num);
    const esBot   = (num === botNo);

    if (!esAdmin && !esBot) elegibles.push(realId);
  }

  if (!elegibles.length) {
    return conn.sendMessage(chatId, {
      text: "⚠️ No hay suficientes participantes para hacer el sorteo."
    }, { quoted: msg });
  }

  const ganador = elegibles[Math.floor(Math.random() * elegibles.length)];

  // Animación con edición
  const pasos = [
    "🎁 Preparando el sorteo...",
    "🎰 Revolviendo nombres...",
    "🌀 Cargando suerte...",
    "🎯 Apuntando al ganador..."
  ];

  const tempMsg = await conn.sendMessage(chatId, { text: pasos[0] }, { quoted: msg });

  for (let i = 1; i < pasos.length; i++) {
    await new Promise(r => setTimeout(r, 1500));
    await conn.sendMessage(chatId, { edit: tempMsg.key, text: pasos[i] });
  }

  await new Promise(r => setTimeout(r, 1500));
  await conn.sendMessage(chatId, {
    edit: tempMsg.key,
    text: `🎉 *SORTEO REALIZADO*\n\n🏆 *Premio:* ${text}\n👑 *Ganador:* @${DIGITS(ganador)}`,
    mentions: [ganador]
  });
};

handler.command = ['sorteo'];
export default handler;
