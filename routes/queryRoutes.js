const queryController = require("../controllers/queryController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.get("/dataset", queryController.getDataset);

router.post("/gpt/context", authenticateJWT, queryController.getGPTContext);
router.post("/", authenticateJWT, queryController.createQuery);
router.get("/:id", authenticateJWT, queryController.getQuery);

router.get("/", authenticateJWT, queryController.getQueries);
router.put("/:id", authenticateJWT, queryController.updateQuery);
router.delete("/:id", authenticateJWT, queryController.deleteQuery);

module.exports = router;
