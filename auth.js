function authenticate(req, res, next) {
    const apiKey = '123456';
    const userApiKey = req.get('X-API-KEY');
    if (req.method === 'DELETE' && userApiKey !== apiKey) {
        res.status(403).send({ message: 'Forbidden' });
    } else {
        next();
    }
}

module.exports = authenticate;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Utilisateurs (pour l'exemple)
const users = [{ id: 1, username: 'test', password: 'test' }];

passport.use(new LocalStrategy(
    (username, password, done) => {
        // Rechercher l'utilisateur dans votre base de données
        const user = users.find(user => user.username === username);
        if (user === undefined) {
            return done(null, false, { message: 'Invalid username' });
        }
        if (user.password !== password) {
            return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
    }
));

passport.use(new FacebookStrategy({
        clientID: 'YOUR_FACEBOOK_APP_ID',
        clientSecret: 'YOUR_FACEBOOK_APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
    },
    (accessToken, refreshToken, profile, cb) => {
        // Vous pourriez vouloir chercher ou créer un utilisateur dans votre base de données
        // Pour cet exemple, on va simplement retourner le profil
        return cb(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // Trouver l'utilisateur en utilisant l'id sérialisé
    const user = users.find(user => user.id === id);
    done(null, user);
});

module.exports = passport;
