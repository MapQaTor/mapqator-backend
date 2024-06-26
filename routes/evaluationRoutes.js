const evaluationController = require("../controllers/evaluationController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/", evaluationController.insertResult);
router.get("/", authenticateJWT, evaluationController.getAllResults);
router.get(
	"/queries/:query_id",
	authenticateJWT,
	evaluationController.getResultsByQuery
);
router.get(
	"/models/:model_id",
	authenticateJWT,
	evaluationController.getResultsByModel
);

module.exports = router;
