const express = require('express');

const isAuthenticated = require('../middleware/is-authenticated');

const adminHome = require('../controllers/admin/home');
const adminProduct = require('../controllers/admin/product');

const router = express.Router();

router.get('/home', isAuthenticated, adminHome.getAdminHomePage);
router.get('/add-product', isAuthenticated, adminProduct.getAddProductPage);
router.post('/add-product', isAuthenticated, adminProduct.postAddProductInput);

module.exports = router;
