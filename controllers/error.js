exports.get404 = (req, res) => {
	res.status(404).render('error/404', {
		pageTitle: '404 Error',
		path: '/404',
		isAuthenticated: req.session.isLoggedIn
	});
};

exports.get500 = (req, res) => {
	res.status(500).render('error/500', {
		pageTitle: 'Error',
		path: '/500',
		isAuthenticated: req.session.isLoggedIn
	});
};
