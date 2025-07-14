// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function salvarMensagem({ id, grupo, mensagem, fonte, relevancia, datahora }) {
  const query = `
    INSERT INTO public.agent11_whatsapp_news
    (id, grupo, mensagem, fonte, relevancia, datahora)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING;
  `;

  const values = [id, grupo, mensagem, fonte, relevancia, datahora];

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error('Erro ao inserir no banco:', err);
    throw err;
  }
}

module.exports = { salvarMensagem };
