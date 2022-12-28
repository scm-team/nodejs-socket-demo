const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
app.use(cors())

app.get('/driver', (req, res) => {
    res.sendFile(__dirname + '/public/driver.html');
});

app.get('/client', (req, res) => {
    res.sendFile(__dirname + '/public/client.html');
})

let vote = 0;

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database:process.env.DB_DATABASE,
});

io.on('connection', (socket) => {
    connection.query(
        'SELECT * FROM `votes`',
        function (err, results) {
            if (results) {
                socket.emit('voteToUser', results[0]?.count)
            }
        }
    );

    socket.on('vote', function () {
        connection.query('UPDATE  votes SET  count = count + 1 where id = 1', function (error, results, fields) {
            if (error) {
                console.log('db error');
            }
        });
        connection.query(
            'SELECT * FROM `votes`',
            function (err, results) {
                if (results) {
                    socket.broadcast.emit('voteToUser', results[0]?.count)
                }
            }
        );

    })
});


server.listen(process.env.APP_PORT, () => {
    console.log(`listening on *:${process.env.APP_PORT}`);
});