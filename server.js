const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');
const adminsRouter = require('./routes/admins');
const appointmentRouter = require('./routes/appointments');
require('dotenv').config();
 
app.use(express.json());
app.use(cors(
    {
        origin: "*", // allow the server to accept request from different origin
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true // allow session cookie from browser to pass through
    }
));

app.use('/users', usersRouter);
app.use('/admins', adminsRouter);
app.use('/appointments', appointmentRouter);

const port = process.env.PORT || 5000;
let uri = "mongodb+srv://xerxes2000a:73jimd7Gz7T42ogc@cluster0.iez3xip.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
    if (!err) {
        console.log("Connection to database successful!");
    }
});

function getCurrentTime() {
    const date = new Date()
    console.log(date)
}

function getEndDateTime(dateTime) {
    // 2021-03-22T09:00:00
    const hrs = (parseInt(dateTime.split('T')[1].split(':')[0]) + 1).toString().padStart(2, '0')
    const time = hrs + ':00:00'
    const date = dateTime.split('T')[0]
    return date + 'T' + time
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
    getCurrentTime()
    getEndDateTime("2021-03-22T09:00:00")
})

app.get('/', (req, res) => {
    res.status(200).json("Hello");
})

module.exports = app;