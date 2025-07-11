const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { salvarMensagem } = require('./db');
require('dotenv').config();

// 🟩 Adicione os IDs reais dos grupos que você deseja monitorar
const GRUPOS_PERMITIDOS = [
  "120363047732347582@g.us",  // Exemplo
  "120363040505921426@g.us"   // Substitua pelos reais
];

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || !msg.key.remoteJid.endsWith('@g.us')) continue;

      const grupoId = msg.key.remoteJid;
      const conteudo = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

      if (conteudo.trim() === '') return;

      // 🔎 Se quiser descobrir os IDs antes de filtrar, descomente o log abaixo:
      // console.log(`📍 Grupo recebido: ${grupoId} | Conteúdo: ${conteudo}`);

      if (!GRUPOS_PERMITIDOS.includes(grupoId)) continue;

      const autor = msg.key.participant || 'desconhecido';
      const id = msg.key.id;
      const timestamp = new Date((msg.messageTimestamp || Date.now()) * 1000);

      const mensagem = {
        id,
        grupo: grupoId,
        mensagem: conteudo,
        autor,
        timestamp
      };

      try {
        await salvarMensagem(mensagem);
        console.log(`✅ Mensagem salva de ${grupoId}: ${conteudo}`);
      } catch (err) {
        console.error(`❌ Erro ao salvar mensagem:`, err);
      }
    }
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Conexão encerrada. Reconectar?', shouldReconnect);
      if (shouldReconnect) iniciar();
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp com sucesso!');
    }
  });
}

iniciar();
