const express = require('express');
const mysql = require('mysql');
const moment = require('moment');
const path = require('path');


const app = express();


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'estoque_db',
});

app.get('/estoque/:produto', (req, res) => {
  const produto = req.params.produto;

  const sql = `SELECT * FROM estoque WHERE nome = '${produto}'`;

  connection.query(sql, (err, result) => {
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

app.listen(3000, () => {
  console.log('Aplicativo web iniciado na porta 3000!');
});
