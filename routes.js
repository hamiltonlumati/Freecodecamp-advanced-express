const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
    app.route('/').get((req, res) => {
        // Change the response to render the Pug template
        res.render('index', { title: 'Connected to Database', message: 'Please login', showLogin: true, showRegistration: true, showSocialAuth: true });
    });
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/profile');
    });
    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('profile', { username: req.user.username });
    });
    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });
    app.route('/register').post(
        (req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12);
            myDataBase.findOne({ username: req.body.username }, function(err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    myDataBase.insertOne({ username: req.body.username, password: hash }, (err, doc) => {
                        if (err) {
                            res.redirect('/');
                        } else {
                            next(null, doc.ops[0]);
                        }
                    });
                }
            });
        },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('profile');
        }
    );

    app.get('/auth/github', passport.authenticate('github'), (req, res) => {
        res.redirect('/profile');

    })

    app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
        req.session.user_id = req.user.id;
        res.redirect('/chat');
    })

    app.get('/chat', ensureAuthenticated, (req, res) => {
        res.render('chat', {
            user: req.user
        })
    })
    app.use((req, res, next) => {
        res.status(404).type('text').send('Not Found');
    });
};

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}