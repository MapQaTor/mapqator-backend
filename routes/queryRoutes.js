const queryController = require("../controllers/queryController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.get("/dataset", queryController.getDataset);

router.post("/annotate/:id", authenticateJWT, queryController.annotate);
router.post("/gpt/context", authenticateJWT, queryController.getGPTContext);
router.post("/", authenticateJWT, queryController.createQuery);
router.post(
	"/evaluate",
	authenticateJWT,
	queryController.createQueryWithEvaluation
);
router.get("/:id", queryController.getQuery);
router.get("/", queryController.getQueries);
router.put("/:id", authenticateJWT, queryController.updateQuery);
router.put(
	"/:id/evaluate",
	authenticateJWT,
	queryController.updateQueryWithEvaluation
);
router.put("/:id/category", authenticateJWT, queryController.updateCategory);
router.delete("/:id", authenticateJWT, queryController.deleteQuery);

module.exports = router;
