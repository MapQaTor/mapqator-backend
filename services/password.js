const bcrypt = require("bcryptjs");

// Get the password from the command line arguments
const password = process.argv[2];

if (!password) {
	console.error("Please provide a password as a command line argument.");
	process.exit(1);
}

// Hash the password
const hashedPassword = bcrypt.hashSync(password, 10);
console.log(hashedPassword);
