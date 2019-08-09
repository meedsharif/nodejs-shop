const express = require('express');
const { check } = require('express-validator');

const isAuthenticated = require('../middleware/is-authenticated');

const adminHome = require('../controllers/admin/home');
const adminProduct = require('../controllers/admin/product');

const Product = require('../models/Product');

const router = express.Router();

router.get('/home', isAuthenticated, adminHome.getAdminHomePage);
router.get('/products', isAuthenticated, adminProduct.getAdminProductsPage);
router.get('/add-product', isAuthenticated, adminProduct.getAddProductPage);

router.post(
	'/add-product',
	[
		check('title', 'Enter a valid title')
			.isString()
			.custom(title => {
				return Product.findOne({ title }).then(product => {
					if (product) {
						return Promise.reject(
							// Check if the matches with another already existing product
							'Product with this title exists please pick a different title'
						);
					}
				});
			})
			.isLength({ min: 3, max: 255 })
			.trim(),
		check('price', 'Enter a valid Price').isFloat(),
		check('quantity', 'Enter a valid quantity').isInt(),
		check('description', 'Description have to be minimum 50 characters long')
			.isLength({ min: 50 })
			.trim()
	],
	isAuthenticated,
	adminProduct.postAddProductInput
);

router.get(
	'/edit-product/:title',
	isAuthenticated,
	adminProduct.getEditProductPage
);
router.post(
	'/edit-product/:productId',
	[
		check('title', 'Enter a valid title')
			.isString()
			.custom((title, { req }) => {
				return Product.findOne({ title }).then(product => {
					if (product) {
						// Check if the matches with another already existing product other than this
						if (product._id.toString() !== req.body.productId.toString())
							return Promise.reject(
								'Product with this title exists please pick a different title'
							);
					}
				});
			})
			.isLength({ min: 3, max: 255 })
			.trim(),
		check('price', 'Enter a valid Price').isFloat(),
		check('quantity', 'Enter a valid quantity').isInt(),
		check('description', 'Description have to be minimum 50 characters long')
			.isLength({ min: 50 })
			.trim()
	],
	isAuthenticated,
	adminProduct.postEditPageInput
);
router.get(
	'/delete-product/:productId',
	isAuthenticated,
	adminProduct.deleteProduct
);

module.exports = router;
