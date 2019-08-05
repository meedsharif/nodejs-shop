const express = require('express');
const { check } = require('express-validator');

const User = require('../models/User');

const authLogin = require('../controllers/auth/login');
const authSignup = require('../controllers/auth/signup');
const authResetPassword = require('../controllers/auth/resetPassword');

const router = express.Router();

router.get('/login', authLogin.getLoginPage);
router.post(
	'/login',
	[
		check('email', 'Enter a valid email')
			.isEmail()
			.normalizeEmail(),
		check('password', 'Enter a valid password')
			.not()
			.isEmpty()
	],
	authLogin.postLoginInput
);
router.post('/logout', authLogin.postLogout);

// Signup Related
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

router.get('/resetpassword', authResetPassword.getResetPasswordPage);

router.post(
	'/resetpassword',
	[
		check('email', 'Enter a valid Email')
			.isEmail()
			.normalizeEmail()
	],
	authResetPassword.postResetPasswordInput
);

router.get('/resetpassword/:token', authResetPassword.getNewPasswordPage);

router.post(
	'/newpassword',
	[
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
	authResetPassword.postNewPasswordInput
);

module.exports = router;
