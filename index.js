const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { salvarMensagem } = require('./db');
const { Boom } = require('@hapi/boom');
require('dotenv').config();

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message || !msg.key.remoteJid.endsWith('@g.us')) continue;
      const conteudo = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const grupo = msg.pushName || msg.key.remoteJid;
      const autor = msg.key.participant || 'desconhecido';
      const id = msg.key.id;
      const timestamp = new Date((msg.messageTimestamp || Date.now()) * 1000);

      if (conteudo.trim() === '') return;

      const mensagem = {
        id,
        grupo,
        mensagem: conteudo,
        autor,
        timestamp
      };

      await salvarMensagem(mensagem);
      console.log(🔹 Mensagem salva: ${conteudo});
    }
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🛑 Conexão encerrada. Reconectar?', shouldReconnect);
      if (shouldReconnect) iniciar();
    } else if (connection === 'open') {
      console.log('✅ Conectado com sucesso!');
    }
  });
}

iniciar();
