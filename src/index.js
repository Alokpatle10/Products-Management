const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const mongoose  = require('mongoose');
const multer = require("multer")
const app = express();

app.use(multer().any())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect("mongodb+srv://user_1:password45@cluster0.d0linvl.mongodb.net/hero?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
})