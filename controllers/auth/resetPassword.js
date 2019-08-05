const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

exports.getResetPasswordPage = (req, res) => {
	// If there is an error initialize the message var with error array from connect-flash library else set it as null.
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}

	// validationErrors: stores the error array
	res.render('auth/resetPassword', {
		pageTitle: 'Reset Password',
		path: '/resetpassword',
		errorMessage: message,
		validationErrors: []
	});
};

let token, resetTokenExpiration;

exports.postResetPasswordInput = (req, res, next) => {
	const email = req.body.email;

	// validationResult() holds the error array
	const errors = validationResult(req);

	let fname;

	User.findOne({ email })
		.then(userDoc => {
			if (!userDoc) {
				return res.status(422).render('auth/resetPassword', {
					pageTitle: 'Reset Password',
					path: '/resetpassword',
					errorMessage: 'User with this email does not exist in our database.',
					validationErrors: errors.array()
				});
			}

			fname = userDoc.name.fname;

			const buffer = crypto.randomBytes(32);
			token = buffer.toString('hex');

			userDoc.resetPassword.resetToken = token;
			userDoc.resetPassword.resetTokenExpiration = Date.now() + 3600000;
			return userDoc.save();
		})
		.then(() => {
			// Get the hostname with port in development and without port when in production
			let hostname;
			if (process.env.NODE_ENV === 'production') {
				hostname = req.hostname;
			} else {
				hostname = req.headers.host;
			}

			console.log(fname + ' ' + hostname);
			// Send email to the user with the activation link
			const msg = {
				to: email,
				from: 'admin@nodejs-shop.com',
				templateId: process.env.SENDGRID_TEMPLATE_RESET_PASSWORD,
				dynamic_template_data: {
					link: `${hostname}/resetpassword/${token}?email=${email}`
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

exports.getNewPasswordPage = (req, res, next) => {
	const passToken = req.params.token;
	const email = req.query.email;

	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}

	User.findOne({ email })
		.then(userDoc => {
			// Get Expiration date
			resetTokenExpiration = userDoc.resetPassword.resetTokenExpiration;

			let isoDate = new Date(Date.now()).toISOString();
			let currentTime = new Date(isoDate);
			let expireTime = new Date(userDoc.resetPassword.resetTokenExpiration);

			if (passToken !== userDoc.resetPassword.resetToken) {
				return res.redirect('/');
			}

			// The expiration time should be more than the current time. so if it is less then user cannot proceed any further
			if (currentTime.getTime() > expireTime.getTime()) {
				return res.status(422).render('auth/newpassword', {
					pageTitle: 'New Password',
					path: '/newpassword',
					errorMessage: 'Time Expired please request for a new reset token',
					validationErrors: []
				});
			} else {
				res.render('auth/newpassword', {
					pageTitle: 'New Password',
					path: '/newpassword',
					userId: userDoc._id.toString(),
					passwordToken: passToken,
					errorMessage: message,
					validationErrors: []
				});
			}
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postNewPasswordInput = (req, res, next) => {
	const newpassword = req.body.password;
	const userId = req.body.userId;
	const passwordToken = req.body.passToken;
	let resetUser;

	// validationResult() holds the error array
	const errors = validationResult(req);

	// Render the login page with addination error message if there is an error
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/newpassword', {
			pageTitle: 'New Password',
			path: '/newpassword',
			userId,
			passwordToken,
			errorMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});
	}

	User.findOne({
		resetPassword: {
			resetToken: passwordToken,
			resetTokenExpiration
		},
		_id: userId
	})
		.then(user => {
			resetUser = user;
			return bcrypt.hash(newpassword, 12);
		})
		.then(hashedPassword => {
			resetUser.password = hashedPassword;
			resetUser.resetPassword = undefined;
			return resetUser.save();
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
