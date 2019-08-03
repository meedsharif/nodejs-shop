const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getSignupPage = (req, res) => {
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}

	res.render('auth/signup', {
		pageTitle: 'Sign Up',
		path: '/signup',
		errorMessage: message,
		oldInput: {
			email: '',
			fname: '',
			lname: ''
		},
		validationErrors: []
	});
};

exports.postSignupInput = (req, res, next) => {
	const email = req.body.email;
	const fname = req.body.fname;
	const lname = req.body.lname;
	const password = req.body.password;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email,
				fname,
				lname
			},
			validationErrors: errors.array()
		});
	}
	let token;

	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const buffer = crypto.randomBytes(32);
			token = buffer.toString('hex');

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
			let hostname;
			if (process.env.NODE_ENV === 'production') {
				hostname = req.hostname;
			} else {
				hostname = req.headers.host;
			}

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
	const token = req.params.token;

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
