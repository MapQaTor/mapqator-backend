const router = require("express").Router();
const placeRoutes = require("./placeRoutes");
const queryRoutes = require("./queryRoutes");
const base = require("../repositories/base");

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

module.exports = router;
