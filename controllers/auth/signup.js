const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

exports.getSignupPage = (req, res) => {
	res.render('auth/signup', {
		pageTitle: 'Sign Up',
		path: '/signup'
	});
};

exports.postSignupInput = (req, res) => {
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

	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				email,
				name: { fname, lname },
				password: hashedPassword,
				cart: { items: [] }
			});
			return user.save();
		})
		.then(() => {
			res.redirect('/');
		})
		.catch(err => {
			console.log(err);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
