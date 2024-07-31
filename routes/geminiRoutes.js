const geminiController = require("../controllers/geminiController");
const router = require("express").Router();
router.post("/ask", geminiController.askGeminiLive);

module.exports = router;
