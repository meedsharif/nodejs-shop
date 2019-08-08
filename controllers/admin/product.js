const fileHelper = require('../../util/file');

const { validationResult } = require('express-validator');

const Product = require('../../models/Product');

exports.getAdminProductsPage = (req, res, next) => {
	Product.find()
		.then(productsArr => {
			res.render('admin/products', {
				pageTitle: 'All Products',
				path: 'admin/products',
				products: productsArr
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getAddProductPage = (req, res, next) => {
	let message = req.flash('error');
	if (message.lenght > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render(
		'admin/productform',
		renderProductFormPage('Add Product', false, null, message, [])
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
					'Add Product',
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
					'Add Product',
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

exports.getEditProductPage = (req, res, next) => {
	const productName = req.query.editing;
	console.log(productName);
	Product.findOne({ title: productName, userId: req.user._id })
		.then(product => {
			if (!product) {
				return res.redirect('/admin/home');
			}
			console.log(product);
			res.render(
				'admin/productform',
				renderProductFormPage(
					'Edit Product',
					false,
					product,
					false,
					[],
					productName
				)
			);
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postEditPageInput = (req, res, next) => {
	const productId = req.params.productId;

	const updatedTitle = req.body.title;
	const updatedPrice = req.body.price;
	const updatedCategories = req.body.categories;
	const updatedDescription = req.body.description;
	const updatedImage = req.file;
	const updatedQuantity = req.body.quantity;
	const userId = req.user._id;
	const errors = validationResult(req);

	const productObj = {
		title: updatedTitle,
		price: updatedPrice,
		categories: updatedCategories,
		description: updatedDescription,
		quantity: updatedQuantity
	};

	if (!errors.isEmpty()) {
		return res
			.status(422)
			.render(
				'admin/productform',
				renderProductFormPage(
					'Edit Product',
					true,
					productObj,
					errors.array()[0].msg,
					errors.array()
				)
			);
	}

	Product.findOne({ _id: productId, userId })
		.then(product => {
			if (!product) {
				return res.redirect('/admin/home');
			}

			product.title = updatedTitle;
			product.price = updatedPrice;
			product.categories = updatedCategories;
			product.quantity = updatedQuantity;
			product.description = updatedDescription;

			if (updatedImage) {
				fileHelper.deleteFile(product.imageUrl);
				product.imageUrl = updatedImage.path;
			}

			return product.save();
		})
		.then(() => {
			res.redirect('/admin/products');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.deleteProduct = (req, res, next) => {
	const productId = req.params.productId;

	Product.findOne({ _id: productId, userId: req.user._id })
		.then(product => {
			if (!product) {
				return res.redirect('/admin/home');
			}
			fileHelper.deleteFile(product.imageUrl);
			return Product.deleteOne({ _id: productId });
		})
		.then(() => {
			res.redirect('/admin/products');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

const renderProductFormPage = (
	pageTitle,
	hasError,
	productObj = null,
	errorMessage,
	validationErrors,
	editing = false
) => {
	const str = pageTitle;
	const path = str.replace(/\s+/g, '-').toLowerCase();
	return {
		pageTitle,
		path: '/admin/' + path,
		editing: false,
		hasError,
		product: productObj,
		errorMessage,
		validationErrors,
		editing
	};
};
