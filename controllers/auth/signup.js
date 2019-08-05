const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getSignupPage = (req, res) => {
	// If there is an error initialize the message var with error array from connect-flash library else set it as null.
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}
	let oldInput = {
		email: '',
		fname: '',
		lname: ''
	};

	// oldInput: if there is an error the input is kept even after refresh.
	// validationErrors: stores the error objects
	res.render('auth/signup', renderSignupPage(oldInput, message, []));
};

exports.postSignupInput = (req, res, next) => {
	const email = req.body.email;
	const fname = req.body.fname;
	const lname = req.body.lname;
	const password = req.body.password;

	// validationResult() holds the error array
	const errors = validationResult(req);

	let oldInput = {
		email,
		fname,
		lname
	};

	// Render the signup page with addination error message if there is an error
	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render(
				'auth/signup',
				renderSignupPage(oldInput, errors.array()[0].msg, errors.array())
			);
	}

	// token for email activation
	let token;

	// encrypt password before storing the user object
	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const buffer = crypto.randomBytes(32);
			token = buffer.toString('hex');

			// Create a user object and save it to db
			const user = new User({
				email,
				name: { fname, lname },
				password: hashedPassword,
				accountActivation: {
					activateToken: token
				},
				cart: { items: [] }
			});
			return user.save();
		})
		.then(() => {
			// Get the hostname with port in development and without port when in production
			let hostname;
			if (process.env.NODE_ENV === 'production') {
				hostname = req.hostname;
			} else {
				hostname = req.headers.host;
			}
			// Send email to the user with the activation link
			const msg = {
				to: email,
				from: 'admin@nodejs-shop.com',
				templateId: process.env.SENDGRID_TEMPLATE_ACC_ACTIVATION,
				dynamic_template_data: {
					fname,
					activationlink: hostname + '/activate/' + token
				}
			};

			return sgMail.send(msg);
		})
		.then(() => {
			res.redirect('/');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getAccountActivation = (req, res, next) => {
	// Get the token from url
	const token = req.params.token;

	// find the user with the token and update the user object.
	User.findOne({ accountActivation: { activateToken: token } })
		.then(user => {
			user.accountActivation = undefined;
			return user.save();
		})
		.then(() => {
			res.redirect('/');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

/**
 * Example: renderSignupPage({email: emailInput, fname: fnameInput, lname: lnameInput}, 'Error Message', validationErrors[])
 *
 * @param {Object} oldInputObject Takes an object of inputs email, fname, lname
 * @param {String} errorMessageString Takes errorMessage if there is any
 * @param {Array} validationErrorsArray Takes error array from validation error
 */

const renderSignupPage = (
	oldInputObject,
	errorMessageString,
	validationErrorsArray
) => {
	return {
		pageTitle: 'Sign Up',
		path: '/signup',
		oldInput: oldInputObject,
		errorMessage: errorMessageString,
		validationErrors: validationErrorsArray
	};
};
