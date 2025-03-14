const gptController = require("../controllers/gptController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();
// router.use(authenticateJWT);
router.post("/ask", gptController.askGPTLive);
router.post("/ask-many", gptController.askMulipleQuestions);
router.get("/ask/:id", gptController.askGPT);
router.post("/context", gptController.generateContext);
router.post("/translate", gptController.translateContext);
router.post("/generate-question", gptController.generateQuestionGemini);

module.exports = router;
