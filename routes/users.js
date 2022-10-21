const router = require('express').Router();
const User = require('../models/user.model');
const appointmentImport = require('../models/appointment.model');
const jwt = require('jsonwebtoken');
const { Appointment } = appointmentImport;

// To get all the patients
// ** ONLY FOR TESTING **
router.route('/').get((req, res) => {
    User.find().then(users => {
        res.status(200).json(users);
    }).catch((err) => {
        res.status(400).json(`Error : ${err}`);
    })
})

// To add a patient
router.route('/add').post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    //const picture = req.body.picture;

    const newUser = new User({
        username, password, name, email, phone
    })

    newUser.save().then(() => {
        res.status(200).json('User added');
    }).catch(err => {
        res.status(400).json(`Error : ${err}`);
    })
})

// To update a patient's phone number
router.route('/update-phone').put((req, res) => {
    const userId = req.body.userId;

    User.findOne({ _id: userId }).then(user => {
        if (user) {
            user.phone = req.body.phone;

            user.save().then(() => {
                res.status(200).json('User\'s phone number updated');
            }).catch(err => {
                res.status(400).json({ message: `Error : ${err}` });
            });
        }
    })
})

// Patient login
router.route("/login").post(async (req, res) => {
	try {
		const username = req.body.username;

		// Password entered by the user
		const plainTextPassword = req.body.password;

		const user = await User.findOne({
			username: username,
			password: plainTextPassword,
		});

		console.log(user);

		if (user === null) {
			return res.status(201).json({ message: "wrong username or password" });
		}

		// User found, return the token to the client side
		const token = jwt.sign(
			JSON.stringify(user),
			"1234"
		);

        const userId = user._id;
        console.log(userId);


		return res.status(200).json({token: token.toString(), userId: userId});

	} catch (err) {
		console.log(err);
		return res.status(400).json(err);
	}
});

router.route('/getUserDetails/:userId').get(async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ _id: userId });

        if (user) {
            return res.status(200).json(user);
        }
        else {
            return res.status(201).json({ message: "User not found!" });
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ message: err });
    }
})

router.route('/previous-appointments').post(async (req, res) => {
    try {
        const userId = req.body.userId;
        const appointments = await Appointment.find({ userId: userId, statusCode:3});

    res.status(200).json(appointments);
    }
    catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
})

router.route('/upcoming-appointments').post(async (req, res) => {
    try {
        const userId = req.body.userId;
        const appointments = await Appointment.find({ userId: userId , statusCode:{$in:[0,1,2]}});

        res.status(200).json(appointments);
    }
    catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
})

module.exports = router;