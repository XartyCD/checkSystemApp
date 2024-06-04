const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Создаем соединение с базой данных
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'veterok'
});

app.use(express.json())


app.post('/register', (req, res) => {
  const { login, password } = req.body;
  const query = 'SELECT COUNT(*) AS count FROM authed WHERE login =?';
  db.query(query, [login], (error, results, fields) => {
    if (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ success: false });
      return;
    }

    if (results[0].count > 0) {
      res.status(400).json({ success: "repeat" });
    } else {
      // Регистрация нового пользователя
      const query = 'INSERT INTO authed (login, password) VALUES (?,?)';
      db.query(query, [login, password], (error, results, fields) => {
        if (error) {
          console.error('Ошибка при выполнении запроса:', error);
          res.status(500).json({ success: false });
          return;
        }

        res.status(200).json({ success: true });
      });
    }
  });
});


app.post('/login', (req, res) => {
  const { login, password } = req.body;
  const query = 'SELECT * FROM authed WHERE BINARY login = ?';

  db.query(query, [login], (error, results, fields) => {
    if (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ success: false });
    } else if (!results.length) {
      // Обработка ошибки, когда пользователь не найден в базе
      res.status(200).json({ success: false });
    } else if (results[0].login === login && results[0].password === password) {
      res.status(200).json({ success: true, user: login});
    } else {
      res.status(200).json({ success: false });
    }
  });
});


app.listen(3000, () => {
    console.log(`Сервер успешно запущен на порту ${port}`);
});
