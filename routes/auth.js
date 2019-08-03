const express = require('express');
const { check } = require('express-validator');

const User = require('../models/User');

const authSignup = require('../controllers/auth/signup');

const router = express.Router();

router.get('/signup', authSignup.getSignupPage);

router.post(
	'/signup',
	[
		check('email', 'Enter a valid Email')
			.isEmail()
			.custom(emailInput => {
				return User.findOne({ email: emailInput }).then(userDoc => {
					if (userDoc) {
						return Promise.reject(
							'Email already exists, please pick a different one'
						);
					}
				});
			})
			.normalizeEmail(),
		check('fname', 'Input fields cannot be empty')
			.not()
			.isEmpty(),
		check('lname', 'Input fields cannot be empty')
			.not()
			.isEmpty(),
		check('password', 'Password have to be atleast 5 characters long.')
			.isLength({ min: 5 })
			.trim(),
		check('confirmPassword')
			.custom((confirmpasswordInput, { req }) => {
				if (confirmpasswordInput !== req.body.password) {
					throw new Error('Passwords have to match');
				}
				return true;
			})
			.trim()
	],
	authSignup.postSignupInput
);
router.get('/activate/:token', authSignup.getAccountActivation);

module.exports = router;
