const router = require("express").Router();
const placeRoutes = require("./placeRoutes");
const queryRoutes = require("./queryRoutes");

router.use("/places", placeRoutes);
router.use("/queries", queryRoutes);

module.exports = router;
