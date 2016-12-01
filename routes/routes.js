module.exports = function(app, passport) {
    if(isLoggedIn) {
        require('../controllers/socket.js')(app);
    }
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/',isNotLoggedIn, function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    app.get('/city', function(req, res) {
        res.render('city.ejs'); // load the index.ejs file
    });

    app.get('/form', function(req, res) {
        res.render('form.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login',isNotLoggedIn, function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) {
                return next(err); // will generate a 500 error
            }
            // Generate a JSON response reflecting authentication status
            if (! user) {
                return res.send({ success : false, message : req.flash('loginMessage') });
            }

            req.login(user, function(loginErr) {
                if (loginErr) {
                    return next(loginErr);
                }
                return res.send({ success : true, message : 'authentication succeeded' });
        });
        })(req, res, next);
    });

    // process the signup form
    app.post('/signup',isNotLoggedIn, passport.authenticate('local-signup', {
        successRedirect : '/chat', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup',isNotLoggedIn, function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // route for login form
    // route for processing the login form
    // route for signup form
    // route for processing the signup form

    // route for showing the profile page
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/chat', isLoggedIn, function(req,res) {
        res.render('users.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook',isNotLoggedIn, passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

    // route for logging out
    app.get('/logout',isLoggedIn, function(req, res) {
        req.logout();
        res.redirect('/');
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
// route middleware to make sure a user is logged in
function isNotLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (!req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/chat');
}