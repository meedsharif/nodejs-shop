const bcrypt = require('bcryptjs');
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
	res.render('auth/login', renderLoginPage({ email: '' }, message, []));
};

exports.postLoginInput = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	// validationResult() holds the error array
	const errors = validationResult(req);

	// Render the login page with addination error message if there is an error
	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render(
				'auth/login',
				renderLoginPage({ email }, errors.array()[0].msg, errors.array())
			);
	}

	// Find user with the email. Render the page with error page if not found
	User.findOne({ email }).then(user => {
		if (!user) {
			return res
				.status(422)
				.render(
					'auth/login',
					renderLoginPage({ email }, 'Invalid email or password', [])
				);
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
				return res
					.status(422)
					.render(
						'auth/login',
						renderLoginPage({ email }, 'Invalid email or password', [])
					);
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

/**
 * Example: renderLoginPage({email: emailInput}, 'Error Message', validationErrors[])
 *
 * @param {Object} oldInputObject Takes an object of input (email)
 * @param {String} errorMessageString Takes errorMessage if there is any
 * @param {Array} validationErrorsArray Takes error array from validation error
 */
const renderLoginPage = (
	oldInputObject,
	errorMessageString,
	validationErrorsArray
) => {
	return {
		pageTitle: 'Login',
		path: '/login',
		errorMessage: errorMessageString,
		oldInput: oldInputObject,
		validationErrors: validationErrorsArray
	};
};
