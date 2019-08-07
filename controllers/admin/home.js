const User = require('../../models/User');

exports.getAdminHomePage = (req, res, next) => {
	res.render('admin/home', {
		pageTitle: 'Admin Home',
		path: '/'
	});
};
