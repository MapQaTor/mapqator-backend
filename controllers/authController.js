const userRepository = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const login = async (req, res) => {
	const { username, password } = req.body;

	try {
		const result = await userRepository.getUserByUsername(username);
		if (result.success) {
			const user = result.data[0];
			if (bcrypt.compareSync(password, user.password)) {
				const token = jwt.sign(
					{
						username: user.username,
						iss: "mapquest-app.onrender.com",
					},
					process.env.JWT_SECRET
				);
				res.status(200).json({ access_token: token });
			} else {
				res.status(401).json({ error: "Invalid password" });
			}
		} else {
			res.status(400).json({ error: "Invalid username" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	login,
};
