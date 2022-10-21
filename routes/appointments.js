const router = require('express').Router();
const appointmentImport = require("../models/appointment.model");
const { Appointment, Feedback } = appointmentImport;
var Kavenegar = require('kavenegar');


router.route('/update_status').put((req, res) => {
    let status = req.body.statusCode;
    if(status>3 || status<0){
        return res.status(400).json({ message: 'Invalid value for status'});
    }
    const appointmentId = req.body.appointmentId;
    const statusCode = status;

    switch(status){
        case "0":
            status="در انتظار تایید";
            break;
        case "1":
            status="تایید شده";
            break;
        case "2":
            status="در حال انجام";
            break;
        case "3":
            status="تمام شده";
            break;
        default :
            status="در انتظار تایید";
            break;
    }

    Appointment.findOne({ _id: appointmentId }).then((appointment) => {
        if (appointment) {
            appointment.status = status;
            appointment.statusCode = statusCode;
            console.log(`Status revieved : ${statusCode}`);

            appointment.save().then(() => {
                console.log(`Status updated!`);
                //send sms
                const message = " خودروی شما در وضعیت "+ status + " قرار گرفت ";
                var api = Kavenegar.KavenegarApi({
                    apikey: '7A2F4F79484B302F572B70735251634C326B525A7A794F4968796A63347A6E6976797458514B58377758673D'
                });
                api.Send({
                        message: message,
                        sender: "2000500666",
                        receptor: "09930812012"
                    },
                    function(response, status) {
                        console.log(response);
                        console.log(status);
                    });                

                res.status(200).json({ message: "Status updated!" });
            }).catch((err) => {
                console.log(`Cannot update appointment status due to ${err}`);
                res.status(400).json({ message: `Cannot update appointment status due to ${err}` });
            })
        }
    })
})

router.route('/feedback').put((req, res) => {
    const appointmentId = req.body.appointmentId;
    const stars = req.body.stars;
    const title = req.body.title;
    const review = req.body.review;

    Appointment.findOne({ _id : appointmentId }).then((appointment) => {
        if(appointment) {
            appointment.feedback.stars = stars;
            appointment.feedback.title = title;
            appointment.feedback.review = review;
            appointment.feedback.given = true;

            appointment.save().then(() => {
                res.status(200).json({message : `Feedback updated successfully!`});
            }).catch(err => {
                console.log(err);
                res.status(400).json(err);
            })
        }
    }).catch(err => {
        console.log(err);
        res.status(400).json(err);
    })
})

module.exports = router;