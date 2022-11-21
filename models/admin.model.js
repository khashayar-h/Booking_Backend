const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const slotSchema = new Schema({
    time : {
        type: String,
    },
    isBooked : {
        type: Boolean,
        default: false
    }
})

const dateSchedule = new Schema({
    date : {
        type: String
    },
    slots : [slotSchema]
})

const repairDateSchedule = new Schema({
    date : {
        type: String
    },
    time : {
        type: []
    }
})

const adminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    email : {
        type: String
    },
    phoneNumber: {
        type: String
    },
    specialization: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    dates : [dateSchedule],
    repairDateSchedule : [repairDateSchedule]
});

const Admin = mongoose.model('Admin', adminSchema);
const Slot = mongoose.model('Slot', slotSchema);
const DateSchedule = mongoose.model('DateSchedule', dateSchedule);
const RepairDateSchedule = mongoose.model('repairDateSche', repairDateSchedule);

module.exports = {
    Admin,
    Slot,
    DateSchedule,
    RepairDateSchedule
};