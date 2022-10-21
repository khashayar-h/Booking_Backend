const router = require("express").Router();
const admins = require("../models/admin.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const appointmentImport = require("../models/appointment.model");
const { Admin, Slot, DateSchedule } = admins;
const { Appointment, Feedback } = appointmentImport;
var Kavenegar = require('kavenegar');

function createDate(date) {
	return new DateSchedule({
		date: date,
		slots: [
			new Slot({
				time: "09:00:00",
				isBooked: false,
			}),
			new Slot({
				time: "12:00:00",
				isBooked: false,
			}),
			new Slot({
				time: "14:00:00",
				isBooked: false,
			}),
			new Slot({
				time: "17:00:00",
				isBooked: false,
			}),
		],
	});
}

// To get all the admins
// **ONLY FOR TESTING**
router.route("/").get((req, res) => {
	Admin.find()
		.then((admins) => {
			res.json(admins);
		})
		.catch((err) => {
			res.status(400).json(`Error : ${err}`);
		});
});

// To add an admin
router.route("/add").post((req, res) => {
	const username = req.body.username; // Required.. can't be undefined
	const password = req.body.password;
	const name = req.body.name;
	const phoneNumber = req.body.phoneNumber;
	const specialization = req.body.specialization;
	const address = req.body.address;

	const newAdmin = new Admin({
		username,
		password,
		name,
		phoneNumber,
		specialization,
		address,
	});

	newAdmin
		.save()
		.then(() => {
			res.json("Admin added");
			// console.log(`${newAdmin} added!`)
		})
		.catch((err) => {
			res.status(400).json(`Error : ${err}`);
			// console.log(err);
		});
});

// To update an admin
router.route("/update").put((req, res) => {
	const username = req.body.username; // Required.. can't be undefined

	Admin.findOne({ username: username }).then((admin) => {
		if (admin) {
			admin.name = req.body.name;
			admin.phoneNumber = req.body.phoneNumber;
			admin.specialization = req.body.specialization;
			admin.address = req.body.address;

			admin
				.save()
				.then(() => {
					res.json("Admin updated");
					// console.log(`${admin} updated!`)
				})
				.catch((err) => {
					res.status(400).json(`Error : ${err}`);
					// console.log(err);
				});
		}
	});
});

// Admin login
router.route("/login").post(async (req, res) => {
	try {
		const username = req.body.username;

		// Password entered by the user
		const plainTextPassword = req.body.password;

		const admin = await Admin.findOne({
			username: username,
			password: plainTextPassword,
		});

		console.log(admin);

		if (admin === null) {
			return res.status(201).json({ message: "wrong username or password" });
		}

		// Admin found, return the token to the client side
		const token = jwt.sign(
			JSON.stringify(admin),
			process.env.KEY
		);

		return res.status(200).json({ token: token.toString() });

	} catch (err) {
		console.log(err);
		return res.status(400).json(err);
	}
});

// To get the slots available for the date
router.route("/get-slots").post(async (req, res) => {
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
		for (const i of admin.dates) {
			if (i.date === date) {
				return res.status(200).json(i);
			}
			count++;
		}

		const oldLength = count;

		// Add new slots if date not found in the db
		const dateSchedule = createDate(date);
		const updatedAdmin = await Admin.findOneAndUpdate(
			{ _id: admin._id },
			{ $push: { dates: dateSchedule } },
			{ new: true }
		);

		if (updatedAdmin) {
			return res.status(200).json(updatedAdmin.dates[oldLength]);
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

router.route("/book-slot").post((req, res) => {
	const userId = req.body.userId; // Patient's google id
	const userName = req.body.userName; // Patient's name
	const adminId = req.body.adminId; // Doctor's id 606460d2e0dd28cc76d9b0f3 
	const slotId = req.body.slotId; // Id of that particular slot
	const dateId = req.body.dateId; // Id of that particular date

	Admin.findOne({ _id: adminId }).then((admin) => {
		const date = admin.dates.id(dateId);
		const slot = date.slots.id(slotId);
		slot.isBooked = true;
		admin
			.save()
			.then(() => {
				// Create an entry in the appointment database
				const newAppointment = new Appointment({
					adminId: adminId,
					dateId,
					slotId,
					userId: userId,
					date: date.date,
					slotTime: slot.time,
					adminName: admin.name,
					adminEmail: admin.email,
					userName: userName,
					feedback: new Feedback()
				});

				console.log(newAppointment);

				newAppointment
					.save()
					.then((appointment) => {
						const message = " خودروی شما در وضعیت "+ " در انتظار تایید " + " قرار گرفت ";
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
						return res.status(200).json(appointment);
					})
					.catch((err) => {
						console.log(err);
						res.status(400).json(err);
					});
			})
			.catch((err) => {
				console.log(err);
				res.status(400).json({
					message: `An error occurred : ${err}`,
				});
			});
	});
});

router.route("/appointments").post(async (req, res) => {
	try {
		const adminId = req.body.adminId;
		const appointments = await Appointment.find({
			adminId: adminId,
		});
		const sortedAppointments = appointments.sort((a, b) => {
			return (
				Date.parse(b.date + "T" + b.slotTime) -
				Date.parse(a.date + "T" + a.slotTime)
			);
		});

		res.status(200).json(sortedAppointments);
	} catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
});

router.route("/appointment/:id").get(async (req, res) => {
	try {
		const appointmentId = req.params.id;
		const appointment = await Appointment.findOne({
			_id: appointmentId,
		});

		res.status(200).json(appointment);
	} catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
});

router.route('/active-appointments').post(async (req, res) => {
	try {
		const adminId = req.body.adminId;
		const appointments = await Appointment.find({ adminId: adminId, statusCode:{$in:[0,1,2]} });
		res.status(200).json(appointments);
	}
	catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
})

router.route('/previous-appointments').post(async (req, res) => {
	try {
		const adminId = req.body.adminId;

		const appointments = await Appointment.find({ adminId: adminId, statusCode:3 });

	res.status(200).json(appointments);
	}
	catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
})

module.exports = router;
