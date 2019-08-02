const Product = require('../models/Product');

exports.getHome = (req, res) => {
	Product.find()
		.then(productArr => {
			res.render('shop/index', {
				pageTitle: 'Shop',
				path: '/',
				products: productArr
			});
		})
		.catch(err => {
			console.log(err);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
