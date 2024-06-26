const router = require("express").Router();
const placeRoutes = require("./placeRoutes");
const queryRoutes = require("./queryRoutes");
const gptRoutes = require("./gptRoutes");
const mapRoutes = require("./mapRoutes");
const base = require("../repositories/base");
require("../services/passport");
router.get("/", async (req, res) => {
	const result = await base.check();
	if (result.success) {
		res.status(200).send("Hi, welcome to Map Quest");
	} else {
		res.status(404).send("Cannot connect to Database");
	}
});

router.use("/places", placeRoutes);
router.use("/queries", queryRoutes);
router.use("/gpt", gptRoutes);
router.use("/map", mapRoutes);
router.use("/evaluation", require("./evaluationRoutes"));
router.use("/auth", require("./authRoutes"));

module.exports = router;
