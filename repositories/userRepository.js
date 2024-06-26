const base = require("./base");

const getUserByUsername = async (username) => {
	const query = "SELECT * FROM users WHERE username = $1";
	const params = [username];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	getUserByUsername,
};
