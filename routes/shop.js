const path = require('path');

const express = require('express');

const shopIndex = require('../controllers/shop/index');
const shopProducts = require('../controllers/shop/product');

const router = express.Router();

router.get('/', shopIndex.getHome);
router.get('/shop', shopProducts.getShopPage);

module.exports = router;
