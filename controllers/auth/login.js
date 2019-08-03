const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

exports.getLoginPage = (req, res, next) => {
	// If there is an error initialize the message var with error array from connect-flash library else set it as null.
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}

	// oldInput: if there is an error the input is kept even after refresh.
	// validationErrors: stores the error objects
	res.render('auth/login', {
		pageTitle: 'Login',
		path: '/login',
		errorMessage: message,
		oldInput: {
			email: ''
		},
		validationErrors: []
	});
};

exports.postLoginInput = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	// validationResult() holds the error array
	const errors = validationResult(req);

	// Render the login page with addination error message if there is an error
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/login', {
			pageTitle: 'Login',
			path: '/login',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email
			},
			validationErrors: errors.array()
		});
	}

	User.findOne({ email }).then(user => {
		if (!user) {
			return res.status(422).render('auth/login', {
				pageTitle: 'Login',
				path: '/login',
				errorMessage: 'Invalid email or password',
				oldInput: {
					email
				},
				validationErrors: []
			});
		}

		bcrypt
			.compare(password, user.password)
			.then(passwordDidMatch => {
				if (passwordDidMatch) {
					req.session.isLoggedIn = true;
					req.session.user = user;

					return req.session.save(err => {
						console.log(err);
						res.redirect('/');
					});
				}
				// If passwords do not match
				return res.status(422).render('auth/login', {
					pageTitle: 'Login',
					path: '/login',
					errorMessage: 'Invalid email or password',
					oldInput: {
						email
					},
					validationErrors: []
				});
			})
			.catch(err => {
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			});
	});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(err => {
		console.log(err);
		res.redirect('/');
	});
};
