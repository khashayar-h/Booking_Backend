const router = require('express').Router();
const appointmentImport = require("../models/appointment.model");
const admins = require("../models/admin.model");
const { Admin, Slot, DateSchedule, RepairDateSchedule } = admins;
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
            status="آماده برای معاینه فنی";
            break;
        case "1":
            status="تخصیص نوبت";
            break;
        case "2":
            status="در حال انجام";
            break;
        case "3":
            status="تمام شده";
            break;
        default :
            status="آماده برای معاینه فنی";
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

// To get the slots available for the date by admin
router.route("/get-free-slots").post(async (req, res) => {
	try {
		const id = req.body.adminId; // Admin's id
		const date = req.body.date; // Date to book

		const admin = await Admin.findOne({ _id: id });

		// Admin not found
		if (admin === null) {
			console.log("Admin not found in the database!");
			return res.status(201).json({
				message: "Admin not found in the database!",
			});
		}

		// Admin found
		// Find the date
		let count = 0;
		for (const i of admin.repairDateSchedule) {
			if (i.date === date) {
				return res.status(200).json(i);
			}
			count++;
		}
        

		// Add new slots if date not found in the db
		const updatedAdmin = await Admin.findOneAndUpdate(
			{ _id: admin._id },
			{ $push: { repairDateSchedule: new RepairDateSchedule({
                date: date , time: []
            }) } },
			{ new: true }
		);

		if (updatedAdmin) {
            for (const i of updatedAdmin.repairDateSchedule) {
                if (i.date === date) {
                    return res.status(200).json(i);
                }
            }
		} else {
			const err = { err: "an error occurred!" };
			throw err;
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			message: err,
		});
	}
});

// set appointment's time & date by admin
router.route("/update-book-time").post(async (req, res) => {
    try{
    //const appointmentId = req.body.appointmentId;
    const adminId = req.body.adminId; // Doctor's id 606460d2e0dd28cc76d9b0f3
    const date = req.body.date;
    const time = req.body.time; 

    const admin = await Admin.findOne({ _id: adminId });

		// Admin not found
		if (admin === null) {
			console.log("Admin not found in the database!");
			return res.status(201).json({
				message: "Admin not found in the database!",
			});
		}
    let found = 0;
    for (const i of admin.repairDateSchedule) {
        // if in that date there were other appointments
        if (i.date === date) {
            found = 1;
            const updatedAdmin = await Admin.findOneAndUpdate(
                { _id: admin._id,
                  repairDateSchedule: { $elemMatch: { date: date } }
                },
                { $addToSet : { "repairDateSchedule.$.time" : time } },
                { new: true }
            );    
            if (updatedAdmin) {
                return res.status(200).json(updatedAdmin);
            } else {
                const err = { err: "an error occurred!" };
                throw err;
            }  
         }         
    }
             // if there were no appointments in the date
             console.log("arrived here");
             const updatedAdmin = await Admin.findOneAndUpdate(
                 { _id: admin._id },
                 { $push: new RepairDateSchedule({date: date, time: time}) },
                 { new: true }
             );    
             if (updatedAdmin) {
                 return res.status(200).json(updatedAdmin.dates[oldLength]);
             } else {
                 const err = { err: "an error occurred!" };
                 throw err;
             } 
}
catch (err) {
    console.log(err);
    return res.status(400).json({
        message: err,
    });
}
});

module.exports = router;