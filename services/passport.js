const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;
opts.issuer = "mapquest-app.onrender.com";

passport.use(
	new JWTStrategy(opts, async (payload, done) => {
		try {
			done(null, payload);
		} catch (error) {
			done(error, false);
		}
	})
);
