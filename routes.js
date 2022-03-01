const express = require('express');
const config = require("./config");
const router = express.Router();
const sentry = require("@sentry/node")
const tracing = require("@sentry/tracing")

//Pour les formulaires multipart/form-data
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()});

//Validation de formulaire
const {body, validationResult} = require('express-validator');

// database dependency
const Destination = require("./destination");

const AWS = require("aws-sdk");
const uuid = require("uuid");
AWS.config.update(config.s3);
const s3 = new AWS.S3();

sentry.init({
    dsn: "https://647642e8857d4c608d54b3e7e5f159b8:19b3a35905c84964a6bcb775f27affc3@o1156434.ingest.sentry.io/6237740",

    tracesSampleRate: 1.0,
});

const recipients = [
    {"email": "alois.rosenthal45@gmail.com"},
    //{"email": "amedouillard@gmail.com"},
    //{"email": "ichtitski@gmail.com"}
]

//Récupération des images
router.get('/', async function (req, res) {
    const transaction = sentry.startTransaction({
        op: "Get images",
        name: "Recuperation of images",
    });

    setTimeout(async () => {
        try {
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
                    for (let i in data.Contents) {
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
        } catch (e) {
            sentry.captureException(e);
        } finally {
            transaction.finish();
        }
    }, 99);
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

//Récupération des destinations stoquées en base
router.get('/destinations', async function (req, res) {
    const transaction = sentry.startTransaction({
        op: "Get destinations",
        name: "Recuperation of destinations",
    });
    setTimeout(async () => {
        try {
            let destinations = [];
            destinations = await Destination.findAll();
            res.send(JSON.stringify(destinations, null, 2));
        } catch (e) {
            sentry.captureException(e);
        } finally {
            transaction.finish();
        }
    }, 99);
});

//Récupération image
router.get('/file/:filename', function (req, res) {
    const transaction = sentry.startTransaction({
        op: "Get image",
        name: "Recuperation of one image",
    });
    const params = {
        Bucket: config.s3.bucket,
        Key: req.params.filename,
    };
    setTimeout(async () => {
        try {
            s3.getObject(params, function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                    res.contentType(data.ContentType);
                    res.send(data.Body);
                }
            });
        } catch (e) {
            sentry.captureException(e);
        } finally {
            transaction.finish();
        }
    }, 99);
})

//Traitement du formulaire
router.post('/',
    upload.single('image'),
    body('name')
        .isLength({
            min: 4
        })
        .withMessage("The destination name must be at least 4 characters").trim(),
    body('description')
        .isLength({
            min: 8,
            max: 255
        }).withMessage("The description must be between 8-255 characters").trim().escape(),
    async function (req, res) {
        const transaction = sentry.startTransaction({
            op: "Treatment of form",
            name: "Treatment of form",
        });
        setTimeout(async () => {
            try {
                const errors = validationResult(req);
                console.log(errors);
                if (!errors.isEmpty()) {
                    return res.render('./index.twig', {
                        data: req.body,
                        errors: errors

                    });
                }
                const {name, description} = req.body;

                //Upload l'image sur Wasabi
                const bucket = config.s3.bucket;
                if (req.file) {

                    const params = {
                        Bucket: bucket,
                        Key: uuid.v4(),
                        Body: req.file.buffer
                    }

                    s3.upload(params, null, function (err, data) {
                        if (err) {
                            console.error('Erreur pendant l\'upload de l\'image')
                            console.error(err)
                        }
                    })
                }

                await Destination.create({name, description});

                //Envoi de mail
                // request.post(process.env.TRUSTIFI_URL + '/api/i/v1/email', {
                //     headers: {
                //         'x-trustifi-key': process.env.TRUSTIFI_KEY,
                //         'x-trustifi-secret': process.env.TRUSTIFI_SECRET
                //     },
                //     json: {
                //         "recipients": recipients,
                //         "title": "Destination added !",
                //         "html": "The Our Holidays app wishes you a good moment!"
                //     }
                // }, (err, res, body) => {
                //     console.log(body);
                // });

                res.redirect('/');
            } catch (e) {
                sentry.captureException(e);
            } finally {
                transaction.finish();
            }
        }, 99);
    });

router.post('/sentry',
    async function (req, res) {
        const transaction = sentry.startTransaction({
            op: "Test Sentry",
            name: "Test Sentry",
        });
        setTimeout(async () => {
            try {
                sentry.captureException("Test Sentry");
            } catch (e) {
                sentry.captureException(e);
            } finally {
                transaction.finish();
            }
        }, 99);
    });


module.exports = router;
