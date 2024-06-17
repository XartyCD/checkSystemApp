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



app.delete('/delete-user', (req, res) => {
  const { login } = req.body;

  // Удалить заявки пользователя
  const deleteApplicationsQuery = 'DELETE FROM Application WHERE login = ?';
  db.query(deleteApplicationsQuery, [login], (error, results) => {
    if (error) {
      console.error('Ошибка при удалении заявок:', error);
      res.status(500).json({ success: false, message: 'Ошибка при удалении заявок' });
      return;
    }


    const deleteUserHistory = 'DELETE FROM history WHERE login = ?';
    db.query(deleteUserHistory, [login], (error, results) => {
      if (error) {
        console.error('Ошибка при удалении посещений пользователя:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении посещений пользователя' });
        return;
      }})


    // Удалить пользователя
    const deleteUserQuery = 'DELETE FROM authed WHERE login = ?';
    db.query(deleteUserQuery, [login], (error, results) => {
      if (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении пользователя' });
        return;
      }

      res.status(200).json({ success: true, message: 'Пользователь и все его заявки успешно удалены' });
    });
  });
});


app.post('/send-application', (req, res) => {
  const { account, name, service, animal, contact, date } = req.body;

  const maxAppNumberQuery = 'SELECT COALESCE(MAX(application_number), 0) AS maxAppNumber FROM Application WHERE login = ?';

  db.query(maxAppNumberQuery, [account], (error, results, fields) => {
    if (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ success: false });
      return;
    }

    const maxAppNumber = results[0].maxAppNumber;
    const newAppNumber = +maxAppNumber + 1;

    const insertQuery = 'INSERT INTO Application (login, Client, Service, Animal, contact, date, application_number) VALUES (?,?,?,?,?,?,?)';
    db.query(insertQuery, [account, name, service, animal, contact, date, newAppNumber], (error, results, fields) => {
      if (error) {
        console.error('Ошибка при выполнении запроса:', error);
        res.status(500).json({ success: false });
        return;
      }

      res.status(200).json({ success: true, number: newAppNumber});
    });
  });
});


app.get('/applications', (req, res) => {
  const { login } = req.query;

  const query = 'SELECT application_number, Client, Service, Animal, contact, date FROM Application WHERE login = ? ORDER BY application_number';
  db.query(query, [login], (error, results) => {
    if (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ success: false, message: 'Ошибка при получении заявок' });
      return;
    }

    res.status(200).json({ success: true, applications: results });
  });
});




app.delete('/delete-application', (req, res) => {
  const { login, applicationNumber } = req.body;

  const deleteQuery = 'DELETE FROM Application WHERE login = ? AND application_number = ?';
  db.query(deleteQuery, [login, applicationNumber], (error, results) => {
    if (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ success: false, message: 'Ошибка при удалении заявки' });
      return;
    }

    // Перенумерация заявок пользователя после удаления
    const updateQuery = `
      UPDATE Application SET application_number = application_number - 1
      WHERE login = ? AND application_number > ?;
    `;
    db.query(updateQuery, [login, applicationNumber], (error, results) => {
      if (error) {
        console.error('Ошибка при обновлении номеров заявок:', error);
        res.status(500).json({ success: false, message: 'Ошибка при обновлении номеров заявок' });
        return;
      }

      res.status(200).json({ success: true, message: 'Заявка успешно удалена' });
    });
  });
});



app.listen(3000, () => {
    console.log(`Сервер успешно запущен на порту ${port}`);
});
