const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedback = new Schema({
    given : {
        type : Boolean,
        default : false
    },
    stars : {
        type : Number,
        default : 0,
        min : 0,
        max : 5
    },
    title : {
        type : String,
        default : ""
    },
    review : {
        type : String,
        default : ""
    }
})

const appointmentSchema = new Schema({
    adminId : {
        required: true,
        type: String
    },
    dateId : {
        required: true,
        type: String
    },
    slotId : {
        required: true,
        type: String
    },
    userId : {
        required: true,
        type: String
    },
    date : {
        type: String
    },
    slotTime : {
        type: String
    },
    repairDateId : {
        type: String
    },
    repairDate : {
        type: String
    },
    repairSlotId : {
        type: String
    },
    repairSlotTime : {
        type: Object
    },
    adminName : {
        type : String
    },
    adminEmail : {
        type : String
    },
    userName : {
        type : String
    },
    status : {
        type : String,
        default : "در انتظار بازدید"
    },
    statusCode : {
        type : Number,
        default : 0
    },
    feedback : feedback, 
    carModel : {
        type : String,
    },
    description : {
        type : String,
    }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
const Feedback = mongoose.model('Feedback', feedback);

module.exports = { Appointment,  Feedback };