// middleware.js
const passport = require("passport");

const authenticateJWT = passport.authenticate("jwt", {
	failureRedirect: "/invalid",
	session: false,
});

module.exports = {
	authenticateJWT,
};
