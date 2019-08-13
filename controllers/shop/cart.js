const Product = require('../../models/Product');
const User = require('../../models/User');

// Will Refactor later
exports.getCart = (req, res, next) => {
	if (!req.session.isLoggedIn) {
		if (!req.session.cart) {
			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products: [],
				total: 0
			});
		} else {
			var products = [];

			req.session.cart.forEach(p => {
				products.push(p.productId);
			});

			Product.find({ _id: { $in: products } })
				.then(productArr => {
					let cart = [];
					let total = 0;

					for (let i = 0; i < productArr.length; i++) {
						cart.push({
							productId: productArr[i],
							quantity: req.session.cart[i].quantity
						});
					}

					cart.forEach(p => {
						if (p.quantity > 1) {
							total += p.productId.price * p.quantity;
						} else {
							total += p.productId.price;
						}
					});

					res.render('shop/cart', {
						path: '/cart',
						pageTitle: 'Your Cart',
						products: cart,
						total
					});
				})
				.catch(err => {
					const error = new Error(err);
					error.httpStatusCode = 500;
					return next(error);
				});
		}
	} else {
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
			})
			.catch(err => {
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			});
	}
};

exports.postCart = (req, res, next) => {
	const productId = req.body.productId;
	let items;

	Product.findById(productId)
		.then(product => {
			if (!req.session.isLoggedIn) {
				if (!req.session.cart) {
					items = [];
				} else {
					items = req.session.cart;
				}

				const itemIdex = items.findIndex(item => {
					return item.productId.toString() === product._id.toString();
				});

				if (itemIdex >= 0) {
					items[itemIdex].quantity += 1;
				} else {
					items.push({ productId, quantity: 1 });
				}

				req.session.cart = items;
			} else {
				return req.user.addToCart(product);
			}
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

exports.cartDeleteItem = (req, res, next) => {
	const productId = req.body.productId;

	if (!req.session.isLoggedIn) {
		const updatedCartItems = req.session.cart.filter(item => {
			return item.productId.toString() !== productId.toString();
		});
		req.session.cart = updatedCartItems;
		res.redirect('/cart');
	} else {
		req.user
			.removeFromCart(productId)
			.then(() => {
				// Update cartItem and redirect
				let cartItem = req.session.user.cart.items.length;
				if (req.session.isLoggedIn) {
					for (let i = 0; i < req.session.user.cart.items.length; i++) {
						cartItem++;
					}
				}

				res.locals.cartItem = cartItem;

				res.redirect('/cart');
			})
			.catch(err => {
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			});
	}
};
