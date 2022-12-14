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

const repairSlotSchema = new Schema({
    time : {
        type: Object
    },
    name : {
        type: String
    },
    customerId:{
        type: String
    },
    customerName:{
        type: String
    },
    appointmentId : {
        type: String
    }
})

const repairDateSchedule = new Schema({
    date : {
        type: String
    },
    slots: [repairSlotSchema]
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
    repairDateSchedule : [{ type: Schema.Types.ObjectId, ref: 'repairDateSchedule' }]
});

const Admin = mongoose.model('Admin', adminSchema);
const Slot = mongoose.model('Slot', slotSchema);
const DateSchedule = mongoose.model('DateSchedule', dateSchedule);
const RepairDateSchedule = mongoose.model('repairDateSchedule', repairDateSchedule);
const RepairSlot = mongoose.model('repairSlotSchema', repairSlotSchema);

module.exports = {
    Admin,
    Slot,
    DateSchedule,
    RepairSlot,
    RepairDateSchedule
};