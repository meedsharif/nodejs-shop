const path = require('path');

const express = require('express');

const authSignup = require('../controllers/auth/signup');

const router = express.Router();

router.get('/signup', authSignup.getSignupPage);
router.post('/signup', authSignup.postSignupInput);

module.exports = router;
