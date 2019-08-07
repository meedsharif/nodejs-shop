const { validationResult } = require('express-validator');

const Product = require('../../models/Product');

exports.getAddProductPage = (req, res, next) => {
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render(
		'admin/productform',
		renderProductFormPage(false, null, message, [])
	);
};

exports.postAddProductInput = (req, res, next) => {
	const title = req.body.title;
	const price = req.body.price;
	const categories = req.body.categories;
	const description = req.body.description;
	const image = req.file;
	const quantity = req.body.quantity;
	const userId = req.user._id;

	productObj = {
		title,
		price,
		categories,
		description,
		quantity
	};

	if (!image) {
		return res
			.status(422)
			.render(
				'admin/productform',
				renderProductFormPage(
					true,
					productObj,
					'Attached file is not an image',
					[]
				)
			);
	}

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render(
				'admin/productform',
				renderProductFormPage(
					true,
					productObj,
					errors.array()[0].msg,
					errors.array()
				)
			);
	}

	const imageUrl = image.path;

	const product = new Product({
		title,
		price,
		categories,
		description,
		imageUrl,
		quantity,
		userId
	});

	product
		.save()
		.then(() => {
			res.redirect('/admin/home');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

const renderProductFormPage = (
	hasError,
	productObj = null,
	errorMessage,
	validationErrors
) => {
	return {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		hasError,
		product: productObj,
		errorMessage,
		validationErrors
	};
};
