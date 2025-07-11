const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

const salvarMensagem = async (msg) => {
  const query = `
    INSERT INTO whatsapp_news (id, grupo, mensagem, autor, timestamp)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `;
  const values = [msg.id, msg.grupo, msg.mensagem, msg.autor, msg.timestamp];
  await pool.query(query, values);
};

module.exports = { salvarMensagem };
