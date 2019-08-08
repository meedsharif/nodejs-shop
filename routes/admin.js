const express = require('express');

const isAuthenticated = require('../middleware/is-authenticated');

const adminHome = require('../controllers/admin/home');
const adminProduct = require('../controllers/admin/product');

const router = express.Router();

router.get('/home', isAuthenticated, adminHome.getAdminHomePage);
router.get('/products', isAuthenticated, adminProduct.getAdminProductsPage);
router.get('/add-product', isAuthenticated, adminProduct.getAddProductPage);
router.post('/add-product', isAuthenticated, adminProduct.postAddProductInput);
router.get('/edit-product', isAuthenticated, adminProduct.getEditProductPage);
router.post(
	'/edit-product/:productId',
	isAuthenticated,
	adminProduct.postEditPageInput
);
router.get(
	'/delete-product/:productId',
	isAuthenticated,
	adminProduct.deleteProduct
);

module.exports = router;
