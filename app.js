const express = require('express');
const mysql = require('mysql');
const moment = require('moment');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'estoque_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados!');
});

// Rotas

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'cadastro.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/produtos', (req, res) => {
  const { codigo, nome, quantidade, validade, marca_do_produto } = req.body;

  const sql = `INSERT INTO produtos (codigo, nome, quantidade, validade, marca_do_produto) VALUES (?, ?, ?, ?, ?)`;
  const values = [codigo, nome, quantidade, validade, marca_do_produto];

  connection.query(sql, values, (error, results, fields) => {
    if (error) {
      console.error("Erro ao inserir registro:", error.message);
      res.status(500).send("<script>alert('Erro ao inserir registro'); window.location.href='/';</script>");
      return;
    }
    console.log("Registro inserido com sucesso!");
    res.send("<script>alert('Registro inserido com sucesso!'); window.location.href='/';</script>");
    
  });
});

app.get('/estoque/:parametro', (req, res) => {
  const parametro = req.params.parametro;

  let sql;
  let values;

  if (isNaN(parametro)) {
    // O parâmetro não é um número, então é o nome do produto
    sql = `SELECT * FROM produtos WHERE nome = ?`;
    values = [parametro];
  } else {
    // O parâmetro é um número, então é o ID do produto
    sql = `SELECT * FROM produtos WHERE id = ?`;
    values = [parametro];
  }
  
  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Ocorreu um erro ao verificar o estoque!');
    }

    if (result.length === 0) {
      return res.send(`O produto com o parâmetro "${parametro}" não foi encontrado no estoque.`);
    }

    const dataValidade = moment(result[0].validade, 'YYYY-MM-DD');
    const hoje = moment();
    const diasRestantes = dataValidade.diff(hoje, 'days');

    if (diasRestantes <= 0) {
      return res.send(`O produto "${result[0].nome}" está vencido.`);
    } else {
      return res.send(`O produto "${result[0].nome}" tem ${result[0].quantidade} unidades disponíveis e vence em ${diasRestantes} dias.`);
    }
  });
});

app.get('/relatorio', (req, res) => {
  const sql = `SELECT p.*, e.quantidade
               FROM produtos p
               INNER JOIN estoque e ON p.nome = e.nome
               WHERE p.nome LIKE '%pesquisa%'`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Ocorreu um erro ao gerar o relatório!');
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('output.pdf'));

    doc.text('Relatório de Produtos', { align: 'center', size: 20, underline: true });
    doc.moveDown();

    doc.end();
    res.send('Relatório gerado com sucesso!');
  });
});

app.listen(port, () => {
  console.log(`Aplicativo web iniciado na porta ${port}!`);
});
