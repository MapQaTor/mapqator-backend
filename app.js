const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");
const https = require("https");
// const fileUpload = require("express-fileupload");
const appRoutes = require("./routes/appRoutes");

// const corsOptions = {
//   origin: "http://localhost:3000",
//   credentials: true,
// };
// app.use(cors(corsOptions));

cron.schedule("*/14 * * * *", () => {
	let host = "https://mapquest-app.onrender.com/api";
	https
		.get(host, (resp) => {
			if (resp.statusCode == 200) console.log(host + " is alive");
			else console.log(host + " is dead");
		})
		.on("error", (err) => {
			console.log("Error: " + err.message);
		});
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Use cookie-parser middleware

app.use("/api", appRoutes);

app.get("/invalid", (req, res) => {
	res.status(401).send({ error: "access denied" });
});

module.exports = { app };
