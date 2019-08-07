exports.getShopPage = (req, res, next) => {
	res.render('shop/products', {
		pageTitle: 'Products Page',
		path: 'shop'
	});
};
