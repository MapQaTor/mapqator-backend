const gptController = require("../controllers/gptController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();
router.use(authenticateJWT);
router.get("/ask/:id", gptController.askGPT);
router.post("/context", gptController.generateContext);

module.exports = router;
