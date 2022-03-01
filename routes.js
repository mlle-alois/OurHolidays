const express = require('express');
const config = require("./config");
const router = express.Router();

//Pour les formulaires multipart/form-data
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

//Validation de formulaire
const { body, validationResult } = require('express-validator');

// database dependency
const Destination = require("./destination");

const AWS = require("aws-sdk");
const Blitline = require("simple_blitline_node");
const uuid = require("uuid");

AWS.config.update(config.s3);
const s3 = new AWS.S3();

// const recipients = [
//     {"email": "alois.zimmermann45@gmail.com"},
//     {"email": "amedouillard@gmail.com"},
//     {"email": "ichtitski@gmail.com"}
// ]

//Récupération des images
router.get('/', async function (req, res) {
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
    s3.listObjects(params, ofunction (err, data) {
        if (err) {
            res.send(err);
        } else {
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
    // request.post(process.env.TRUSTIFI_URL + '/api/i/v1/email', {
    //     headers: {
    //         'x-trustifi-key': process.env.TRUSTIFI_KEY,
    //         'x-trustifi-secret': process.env.TRUSTIFI_SECRET
    //     },
    //     json: {
    //         "recipients": recipients,
    //         "title": "New connection on Our Holidays",
    //         "html": "We hope you enjoy the app !"
    //     }
    // }, (err, res, body) => {
    //     console.log(body);
    // });
});

//Récupération des destinations stoquées en base
router.get('/destinations', async function (req, res) {
    let destinations = [];
    try {
        destinations = await Destination.findAll();
    } catch (error) {
        console.error(error);
    }
    res.send(JSON.stringify(destinations, null, 2));
});

//Récupération image
router.get('/file/:filename', function (req, res) {
    const params = {
        Bucket: config.s3.bucket,
        Key: req.params.filename,
    };

    s3.getObject(params, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            res.contentType(data.ContentType);
            res.send(data.Body);
        }
    });
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

        console.log("validation");

        const errors = validationResult(req);
        console.log(errors);
        if(!errors.isEmpty()){
            return res.render('./index.twig', {
                data: req.body,
                errors:  errors

            });
        }
        const {name, description} = req.body;

        //Upload l'image sur Wasabi
        const bucket = config.s3.bucket;
        if(req.file){

            const params = {
                Bucket: bucket,
                Key: uuid.v4(),
                Body: req.file.buffer
            }

            s3.upload(params, null,function (err, data) {
                if(err){
                    console.error('Erreur pendant l\'upload de l\'image')
                    console.error(err)
                }

                //Retouche de l'image avec Blitline : ne fonctionne pas pour le moment
                // console.log("KEY : " + data.key);
                // const url = "https://s3.eu-west-1.wasabisys.com/our-holidays-test/" + data.key;
                // const blitline = new Blitline()
                // const blitlineAppId = config.blitline.BLITLINE_APPLICATION_ID;
                // blitline.addJob({
                //     "application_id": blitlineAppId,
                //     "src" : url,
                //     "functions" : [
                //         {
                //             "name": "resize_to_fit",
                //             "params": {
                //                 "width": "20",
                //                 "height": "20"
                //             },
                //             "save" : {
                //                 "image_identifier" : "MY_CLIENT_ID",
                //                 "s3_destination": {
                //                     "bucket": bucket,
                //                     "key": "ALLALALALALALALAL"
                //                 }
                //             }
                //         }]
                // })
                //
                // let promise = blitline.postJobs();
                // promise.then(function(data) {
                //     console.log("data");
                //     console.log(data.results);
                //     console.log(data.results[0]);
                // })

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
    });






module.exports = router;
