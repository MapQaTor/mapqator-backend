const gptController = require("../controllers/gptController");

const router = require("express").Router();

router.post("/context", gptController.generateContext);

module.exports = router;
