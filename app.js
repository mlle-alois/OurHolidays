const request = require("request")
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const AWS = require('aws-sdk');
const config = require('./config');

const app = express();

// database dependency
const Destination = require('./destination.js');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.use('/img', express.static('img'));
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'));

AWS.config.update(config.s3);
const s3 = new AWS.S3();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const recipients = [
    {"email": "alois.zimmermann45@gmail.com"},
    {"email": "alois.rosenthal45@gmail.com"},
    //{"email": "ichtitski@gmail.com"},
    //{"email": "amedouillard@hotmail.fr"}
]

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

app.get('/', async function (req, res, next) {
    let destinations = [];
    try {
        destinations = await Destination.findAll();
    } catch (e) {
    }
    const params = {
        Bucket: config.s3.bucket,
        Delimiter: '/'
    };

    const images = [];
    s3.listObjects(params, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            console.log(data)
            for (i in data.Contents) {
                const image = data.Contents[i];
                const imageProps = {
                    url: '/file/' + image.Key,
                    full_suffix: config.suffix.full
                };
                images.push(imageProps);
            }
            res.render('index', {
                'images': images,
                destinations: destinations
            });
        }
    }); 
    request.post(process.env.TRUSTIFI_URL + '/api/i/v1/email', {
        headers: {
            'x-trustifi-key': process.env.TRUSTIFI_KEY,
            'x-trustifi-secret': process.env.TRUSTIFI_SECRET
        },
        json: {
            "recipients": recipients,
            "title": "New connection on Our Holidays",
            "html": "We hope you enjoy the app !"
        }
    }, (err, res, body) => {
        console.log(body);
    });
});

app.post('/', async function (req, res, next) {
    const {name, description} = req.body;
    await Destination.create({name, description});
    request.post(process.env.TRUSTIFI_URL + '/api/i/v1/email', {
        headers: {
            'x-trustifi-key': process.env.TRUSTIFI_KEY,
            'x-trustifi-secret': process.env.TRUSTIFI_SECRET
        },
        json: {
            "recipients": recipients,
            "title": "Destination added !",
            "html": "The Our Holidays app wishes you a good moment!"
        }
    }, (err, res, body) => {
        console.log(body);
    });
    res.redirect('/');
});

app.get('/destinations', async function (req, res, next) {
    let destinations = [];
    try {
        destinations = await Destination.findAll();
    } catch (e) {
    }
    res.send(JSON.stringify(destinations, null, 2));
});

app.get('/file/:filename', function (req, res) {
    const params = {
        Bucket: config.s3.bucket,
        Key: req.params.filename,
    };

    s3.getObject(params, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            console.log(data);
            res.contentType(data.ContentType);
            res.send(data.Body);
        }
    });
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/*const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('app listening at http://%s:%s', host, port);
});*/

module.exports = app;
