const Product = require('../../models/Product');
const User = require('../../models/User');

exports.getCart = (req, res, next) => {
	User.findById(req.user._id)
		.populate('cart.items.productId')
		.then(user => {
			const products = user.cart.items;

			let total = 0;
			products.forEach(p => {
				if (p.quantity > 1) {
					total += p.productId.price * p.quantity;
				} else {
					total += p.productId.price;
				}
			});

			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products,
				total
			});
		});
};

exports.postCart = (req, res, next) => {
	const productId = req.body.productId;
	Product.findById(productId)
		.then(product => {
			return req.user.addToCart(product);
		})
		.then(() => {
			res.redirect('/cart');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
