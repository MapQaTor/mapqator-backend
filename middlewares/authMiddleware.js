// middleware.js
const passport = require("passport");

const authenticateJWT = passport.authenticate("jwt", {
	failureRedirect: "/invalid",
	session: false,
});

const authenticateOrGuest = (req, res, next) => {
	if (!req.headers.authorization) {
		// No token present, handle guest access (e.g., render a login page)
		return next();
	}
	return passport.authenticate("jwt", {
		failureRedirect: "/invalid",
		session: false,
	})(req, res, next);
};

module.exports = {
	authenticateJWT,
	authenticateOrGuest,
};
