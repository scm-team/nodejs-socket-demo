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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

app.get('/driver', (req, res) => {
    res.sendFile(__dirname + '/public/driver.html');
});

app.get('/client', (req, res) => {
    res.sendFile(__dirname + '/public/client.html');
})

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

io.on('connection', (socket) => {
    
    console.log(`Socket connect with id: ${socket.id}`);
    
    socket.on("disconnect", (reason) => {
        console.log(`Socket disconnect ${socket.id} due to ${reason}`);
    });
    
    connection.query(
        'SELECT * FROM `votes`',
        function (err, results) {
            if (results) {
                io.to(socket.id).emit('voteToClient', {
                    count: results[0]?.count,
                    start_time: results[0]?.start_time,
                    end_time: results[0]?.end_time,
                })
            }
        }
    );
    
    socket.on('stop',function(){
        connection.query('UPDATE  votes SET end_time=now()', function (error, results, fields) {
            if (error) {
                console.log(error);
                io.to(socket.id).emit('resetFail', true)
                return;
            }
            connection.query(
                'SELECT * FROM `votes`',
                function (err, results) {
                    if (!err) {
                        socket.broadcast.emit('stopVote', {
                            count: results[0]?.count,
                            start_time: results[0]?.start_time,
                            end_time: results[0]?.end_time,
                        })
                    }
                }
            );
        });
    });

    socket.on('reset', function () {
        connection.query('UPDATE  votes SET  count = 0,start_time=null,end_time=null', function (error, results, fields) {
            if (error) {
                console.log(error);
                io.to(socket.id).emit('resetFail', true)
                return;
            }
            connection.query(
                'SELECT * FROM `votes`',
                function (err, results) {
                    if (!err) {
                        io.emit('resetVoteToClient', {
                            count: results[0]?.count,
                            start_time: results[0]?.start_time,
                            end_time: results[0]?.end_time,
                        })
                    }
                }
            );
        });
    })

    socket.on('vote', function () {
        connection.query("UPDATE  votes SET  count = count + 1 , start_time=now(),end_time=null WHERE id=1", function (error, results, fields) {
            if (error) {
                console.log(error)
            }
        });
        connection.query(
            'SELECT * FROM `votes`',
            function (err, results) {
                if (results) {
                    socket.broadcast.emit('voteToClient', {
                        count: results[0]?.count,
                        start_time: results[0]?.start_time,
                        end_time: results[0]?.end_time,
                    })
                }
            }
        );

    })
});


server.listen(process.env.APP_PORT, () => {
    console.log(`listening on *:${process.env.APP_PORT}`);
});