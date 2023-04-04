const express = require('express');
const mysql = require('mysql');
const moment = require('moment');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');


const app = express();
const port = 3000;

// Middlewares
app.use(express.urlencoded({
  extended: true
}));
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
app.get('/download', (req, res) => {
  // criar um novo documento PDF
  const doc = new PDFDocument();

  // criar um fluxo de saída para salvar o documento PDF
  const stream = fs.createWriteStream('relatorio.pdf');
  
  // adicionar as informações ao documento PDF
  doc.text('Informações da Tabela');
  doc.moveDown();

  // Busca as informações da tabela produtos
  connection.query('SELECT * FROM produtos', function (error, results, fields) {
    if (error) throw error;

    // Adiciona as informações ao documento
    results.forEach(produtos => {
      doc.text(`Codigo: ${produtos.codigo}`);
      doc.text(`Nome: ${produtos.nome}`);
      doc.text(`Quantidade: ${produtos.quantidade}`);
      doc.text(`Validade: ${produtos.validade}`);
      doc.text(`Marca do produto: ${produtos.marca_do_produto}`);
      doc.moveDown();
    });

    // finalizar o documento PDF
    doc.end();

    // salvar o documento PDF no disco
    doc.pipe(stream);

    // enviar o arquivo PDF para download
    stream.on('finish', function () {
      const file = `${__dirname}/relatorio.pdf`;
      res.download(file);
    });
  });
});

//rota pagina login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));

});
//rota para cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'cadastro.html'));
});
//rota para pagina de verificação de produtos
app.get('/verificar-estoque', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/produtos', (req, res) => {
  const {
    codigo,
    nome,
    quantidade,
    validade,
    marca_do_produto
  } = req.body;

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
      return res.send(`O produto "${result[0].nome}", da marca "${result[0].marca_do_produto}", está vencido.`);
    } else {
      return res.send(`O produto "${result[0].nome}", da marca "${result[0].marca_do_produto}", tem ${result[0].quantidade} unidades disponíveis e vence em ${diasRestantes} dias.`);
    }

  });
});

app.listen(port, () => {
  console.log(`Aplicativo web iniciado na porta ${port}!`);
});