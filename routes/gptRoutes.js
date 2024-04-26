const gptController = require("../controllers/gptController");

const router = require("express").Router();

router.get("/ask/:id", gptController.askGPT);
router.post("/context", gptController.generateContext);

module.exports = router;
