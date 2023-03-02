const express = require('express');
const mysql = require('mysql');
const moment = require('moment');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'estoque_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  }
});

app.post('/produtos', (req, res) => {
  const { codigo, nome, quantidade, validade } = req.body;

  const sql = `INSERT INTO produtos (codigo, nome, quantidade, validade) VALUES (?, ?, ?, ?)`;
  const values = [codigo, nome, quantidade, validade];

  connection.query(sql, values, (error, results, fields) => {
    if (error) {
      console.error("Erro ao inserir registro:", error.message);
      res.status(500).send('Erro ao inserir registro.');
      return;
    }
    console.log("Registro inserido com sucesso!");
    res.send('Registro inserido com sucesso!');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/estoque/:produto', (req, res) => {
  const produto = req.params.produto;

  const sql = `SELECT * FROM estoque WHERE nome = ?`;
  const values = [produto];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Ocorreu um erro ao verificar o estoque!');
    }

    if (result.length === 0) {
      return res.send(`O produto "${produto}" não foi encontrado no estoque.`);
    }

    const dataValidade = moment(result[0].validade, 'YYYY-MM-DD');
    const hoje = moment();
    const diasRestantes = dataValidade.diff(hoje, 'days');

    if (diasRestantes <= 0) {
      return res.send(`O produto "${produto}" está vencido.`);
    } else {
      return res.send(`O produto "${produto}" tem ${result[0].quantidade} unidades e vence em ${diasRestantes} dias.`);
    }
  });
});

app.listen(port, () => {
  console.log(`Aplicativo web iniciado na porta ${port}!`);
});

