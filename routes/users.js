var request = require('request');
var express = require('express');
var router = express.Router();
var ip = require("ip");
/*
  ALL OF THE ROUTES IN THIS PAGE REQUIRE AN AUTHENTICATED USER
*/

/* GET users listing. */
router.get('/', function (req, res, next) {

    res.render('users', {
        title: 'User successfully logged in.',
        username: req.user.data.name,
        handicap: req.user.data.handicap,
        logout: process.env.LOGOUT
    });
});

/* GET the profile of the current authenticated user */
router.get('/profile', function (req, res, next) {

    request.get('http://192.168.1.195:5555/auth/realms/dzb/protocol/openid-connect/userinfo', {
        'auth': {'bearer': req.user.token.access_token}
    }, (err, respose, body) => {

        console.log('User Info');
        console.log(body);

        res.render('profile', {
            logout: process.env.LOGOUT,
            title: 'Profile',
            user: JSON.parse(body)
        });

    });
});

module.exports = router;
