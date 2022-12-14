const router = require('express').Router();
const appointmentImport = require("../models/appointment.model");
const admins = require("../models/admin.model");
const { Admin, RepairDateSchedule, RepairSlot } = admins;
const { Appointment } = appointmentImport;
const User = require('../models/user.model');
var Kavenegar = require('kavenegar');
const { findOne } = require('../models/user.model');
const mongoose = require('mongoose');

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

router.route("/deleteAppointment").delete(async (req, res) =>{
  
    const appointmentId = req.body.appointmentId;
    const adminId = req.body.adminId;

    const admin = await Admin.findOne({ _id: adminId });
    const appointment = await Appointment.findOne({ _id : appointmentId });
 
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
        if(admin.repairDateSchedule.length>0){

            for(let i = 0; i < admin.repairDateSchedule.length; i++){
                const foundedRepairDateSchedule = await RepairDateSchedule.findOne({ _id: admin.repairDateSchedule[i]});
                if(foundedRepairDateSchedule.date == date)
                return res.status(200).json(foundedRepairDateSchedule);
            }
        }
        

		// Add new slots if date not found in the db
        const addedSlot = new RepairDateSchedule({
            date: date , slots: []
        })
        addedSlot.save().then(() => {
           console.log('Slot Schedule added');
        }).catch(err => {
            console.log(`Error : ${err}`);
        })

		const updatedAdmin = await Admin.findOneAndUpdate(
			{ _id: admin._id },
			{ $push: { repairDateSchedule: addedSlot._id } },
			{ new: true }
		);

		if (updatedAdmin) {
            return res.json(addedSlot)
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
    const date = req.body.date;
    const startTime = req.body.startTime; 
    const endTime = req.body.endTime;
    const appointmentId = req.body.appointmentId;

    const appointment  = await Appointment.findOne({ _id : appointmentId });

    const customerId = appointment.userId;

    const adminId = appointment.adminId; // Doctor's id 606460d2e0dd28cc76d9b0f3

    const customerName = appointment.userName;

    const slot = new RepairSlot({time:{startTime: startTime, endTime: endTime}, customerId: customerId,customerName: customerName, appointmentId: appointmentId});

    const admin = await Admin.findOne({ _id: adminId });

        if(appointment === null) {
            console.log("Appointment not found in the database!");
			return res.status(201).json({
				message: "Appointment not found in the database!",
			});
        }
        
		// Admin not found
		if (admin === null) {
			console.log("Admin not found in the database!");
			return res.status(201).json({
				message: "Admin not found in the database!",
			});
		}
    let found = 0;
    for(let i = 0; i < admin.repairDateSchedule.length; i++){
        const foundedRepairDateSchedule = await RepairDateSchedule.findOne({ _id: admin.repairDateSchedule[i]});
        if(foundedRepairDateSchedule.date == date){
            let found = 1;
            for(let i = 0; i < foundedRepairDateSchedule.slots.length; i++)
                {
                    if(checkDates(startTime, endTime, date, foundedRepairDateSchedule.slots[i].time.startTime, foundedRepairDateSchedule.slots[i].time.endTime, foundedRepairDateSchedule.date) == false){
                        found = 0;
                    }
                }
                    if(found == 1){
                        const updatedAdmin = await RepairDateSchedule.findOneAndUpdate(
                            { _id: foundedRepairDateSchedule._id },
                            { $push : { slots : slot } },
                            { new: true }
                        );  
                        const updatedAppointment = await Appointment.findOneAndUpdate(
                            { _id: appointment._id},{repairDateId: foundedRepairDateSchedule._id,
                                                    repairDate: date,
                                                    repairSlotId: slot._id,
                                                    repairSlotTime: {startTime: startTime, endTime: endTime}},
                            {new: true}
                        );  
                        if (updatedAdmin && updatedAppointment) {
                            return res.status(200).send("Appointment set successfully");
                        } else {
                            const err = { err: "an error occurred!" };
                            throw err;
                        }  
                    }
                    return res.status(403).send('Dates or Times have interference')         
            }
        }
    
}
    catch (err) {
        console.log(err);
        return res.status(400).json({
            message: err,
        });
    }
});

router.route("/delete-appointment-time").post(async (req, res) =>{
    const appointmentId = req.body.appointmentId;
    let appointment = await Appointment.findById(appointmentId);
    let repairSlotId = appointment.repairSlotId;
    if(repairSlotId == ""){return res.status(400).send("it was deleted before !")}
    let dateSchedule = await RepairDateSchedule.findById(appointment.repairDateId);
    let updatedDateSchedule;
    let updatedAppointment;
    for(let i = 0; i < dateSchedule.slots.length; i++){
        if(dateSchedule.slots[i]._id.toString() == repairSlotId){
            updatedDateSchedule = await RepairDateSchedule.findOneAndUpdate({_id : dateSchedule._id},
                {
                    $pull: {slots: dateSchedule.slots[i]}
                }
                ,{ new: true})
        }
    }
    if(updatedDateSchedule){
        updatedAppointment = await Appointment.findOneAndUpdate({_id:appointmentId},{
            repairDate : "", repairDateId : "" ,repairSlotTime : "", repairSlotId : ""
        } , {new : true})
    }

    if(updatedAppointment && updatedDateSchedule){
        return res.status(200).send("Appointment Repair Schedule deleted successfully")
    }
    return res.status(400).send("error happened");
})

function checkDates(startTime, endTime, date, reservedStartTime, reservedEndTime, reservedDate){

    startTime = startTime.split(':');
    let startHour = startTime[0];
    let startMinute = startTime[1];
    
    endTime = endTime.split(':');
    let endHour = endTime[0];
    let endMinute = endTime[1];
    
    date = date.split('-');
    let year = date[0];
    let month = date[1];
    let day = date[2];
    
    const startTimeMilisecond = new Date(year, month, day, startHour, startMinute);
    const endTimeMilisecond = new Date(year, month, day, endHour, endMinute);
    
    reservedStartTime = reservedStartTime.split(':');
    let reservedStartHour = reservedStartTime[0];
    let reservedStartMinute = reservedStartTime[1];
    
    reservedEndTime = reservedEndTime.split(':');
    let reservedEndHour = reservedEndTime[0];
    let reservedEndMinute = reservedEndTime[1];
    
    reservedDate = reservedDate.split('-');
    let reservedYear = reservedDate[0];
    let reservedMonth = reservedDate[1];
    let reservedDay = reservedDate[2];
    
    const reservedStartTimeMilisecond = new Date(reservedYear, reservedMonth, reservedDay, reservedStartHour, reservedStartMinute);
    const reservedEndTimeMilisecond = new Date(reservedYear, reservedMonth, reservedDay, reservedEndHour, reservedEndMinute);
    
    if(startTimeMilisecond <= reservedEndTimeMilisecond && reservedStartTimeMilisecond <= endTimeMilisecond) {
      return false;
    }
    return true;
}

module.exports = router;