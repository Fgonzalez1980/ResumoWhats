const { Pool } = require('pg');
require('dotenv').config();

// 📦 Conexão com o PostgreSQL via variáveis do Railway
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 💾 Função para salvar mensagem no banco
async function salvarMensagem({ id, grupo, mensagem, autor, timestamp }) {
  const query = `
    INSERT INTO public.agent11_whatsapp_news (id, grupo, mensagem, fonte, datahora)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING;
  `;

  const values = [id, grupo, mensagem, autor, timestamp];

  await pool.query(query, values);
}

module.exports = {
  salvarMensagem
};
