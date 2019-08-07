const path = require('path');

const express = require('express');

const shopIndex = require('../controllers/shop/index');
const shopProduct = require('../controllers/shop/product');

const router = express.Router();

router.get('/', shopIndex.getHome);
router.get('/shop', shopProduct.getProductsPage);
router.get('/product/:title', shopProduct.getProductDetailsPage);

module.exports = router;
