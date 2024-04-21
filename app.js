const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");

// const fileUpload = require("express-fileupload");
const appRoutes = require("./routes/appRoutes");

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

// app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Use cookie-parser middleware

app.use("/api", appRoutes);

app.get("/invalid", (req, res) => {
  res.status(401).send({ error: "access denied" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
});

module.exports = { app };


