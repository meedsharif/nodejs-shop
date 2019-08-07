const Product = require('../../models/Product');

exports.getProductsPage = (req, res, next) => {
	Product.find()
		.then(productsArr => {
			res.render('shop/products', {
				pageTitle: 'Products Page',
				path: 'shop',
				products: productsArr
			});
		})
		.catch(err => {
			error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};

exports.getProductDetailsPage = (req, res, next) => {
	const title = req.params.title;

	Product.findOne({ title })
		.then(product => {
			res.render('shop/product-details', {
				pageTitle: product.title,
				path: 'product/' + product.title,
				product
			});
		})
		.catch(err => {
			error = new Error(err);
			error.httpStatusCode = 500;
			next(error);
		});
};
