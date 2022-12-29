const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat)
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

    socket.on('stop', function () {
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
                        const startTime = new Date(results[0]?.start_time);
                        const endTime = new Date(results[0]?.end_time);

                        var delta = Math.abs(startTime - endTime) / 1000;

                        // calculate (and subtract) whole days
                        var days = Math.floor(delta / 86400);
                        delta -= days * 86400;

                        // calculate (and subtract) whole hours
                        var hours = Math.floor(delta / 3600) % 24;
                        delta -= hours * 3600;

                        // calculate (and subtract) whole minutes
                        var minutes = Math.floor(delta / 60) % 60;
                        delta -= minutes * 60;

                        // what's left is seconds
                        var seconds = delta % 60;

                        socket.broadcast.emit('stopVote', {
                            count: results[0]?.count,
                            start_time: dayjs(startTime).format('llll'),
                            end_time:  dayjs(endTime).format('llll'),
                            diff:{
                                days,
                                hours,
                                minutes,
                                seconds
                            }
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
                        socket.broadcast.emit('resetVoteToClient', {
                            count: results[0]?.count,
                            start_time: results[0]?.start_time,
                            end_time: results[0]?.end_time,
                        })
                    }
                }
            );
        });
    })

    socket.on('vote', function (isStarted) {
        if (isStarted) {
            connection.query(
                'SELECT * FROM `votes`',
                function (err, results) {
                    if (results) {
                        if (!results[0]?.start_time) {
                            connection.query("UPDATE  votes SET  count = count + 1 , start_time=now(),end_time=null WHERE id=1", function (error, results, fields) {
                                if (error) {
                                    console.log(error)
                                }
                            });
                        } else {
                            connection.query("UPDATE  votes SET  count = count + 1 ,end_time=null WHERE id=1", function (error, results, fields) {
                                if (error) {
                                    console.log(error)
                                }
                            });
                        }
                    }

                }
            );
        } else {
            connection.query("UPDATE  votes SET  count = count + 1 , start_time=null,end_time=null WHERE id=1", function (error, results, fields) {
                if (error) {
                    console.log(error)
                }
            });
        }

        connection.query(
            'SELECT * FROM `votes`',
            function (err, results) {
                if (results) {
                    socket.broadcast.emit('voteToClient', {
                        count: results[0]?.count,
                        start_time: results[0]?.start_time ? dayjs(results[0]?.start_time).format('llll') : '',
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