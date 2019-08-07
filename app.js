const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI_STRING;

const app = express();

const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + '-' + file.originalname);
	}
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 * 10 },
		store
	})
);

app.use(flash());

app.use((req, res, next) => {
	let isAuthenticated = req.session.isLoggedIn;
	res.locals.isAuthenticated = isAuthenticated;

	if (isAuthenticated) {
		res.locals.fname = req.session.user.name.fname;
	}
	next();
});

app.use((req, res, next) => {
	// Continue if the user is not authenticated
	// console.log(req.user.resetPassword.resetTokenExpiration);
	if (!req.session.user) {
		return next();
	}
	// Set user obj to the authenticated user to req.user
	User.findById(req.session.user._id)
		.then(user => {
			if (!user) {
				return next();
			}
			req.user = user;
			next();
		})
		.catch(err => {
			next(new Error(err));
		});
});

app.use(csrfProtection);
app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
	console.log(error);
	res.redirect('/500');
	next();
});

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true })
	.then(() => {
		app.listen(process.env.PORT || 3000);
	})
	.catch(err => console.log(err));
