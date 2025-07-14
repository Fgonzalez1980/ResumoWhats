// index.js
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { salvarMensagem } = require('./db');
require('dotenv').config();

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
      let nomeGrupo = grupoId;
      try {
        const metadata = await sock.groupMetadata(grupoId);
        nomeGrupo = metadata.subject || grupoId;
      } catch (err) {
        console.warn('⚠️ Não foi possível obter nome do grupo:', grupoId);
      }

      const conteudo = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (conteudo.trim() === '') return;

      const autor = msg.key.participant || 'desconhecido';
      const id = msg.key.id;
      const timestamp = new Date((msg.messageTimestamp || Date.now()) * 1000);

      console.log('🆔 ID do grupo:', grupoId);
      console.log('📛 Nome (grupo):', nomeGrupo);
      console.log('💬 Mensagem:', conteudo);
      console.log('---');

      const mensagem = {
        id,
        grupo: nomeGrupo,
        mensagem: conteudo,
        fonte: 'Grupo WhatsApp',
        relevancia: 'Alta',
        datahora: timestamp
      };

      try {
        await salvarMensagem(mensagem);
        console.log('✅ Mensagem salva no banco\n');
      } catch (err) {
        console.error('❌ Erro ao salvar mensagem:', err);
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
