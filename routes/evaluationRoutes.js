const evaluationController = require("../controllers/evaluationController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/", evaluationController.insertResult);
router.post("/new", evaluationController.insertNewResult);
router.get("/", evaluationController.getAllResults);
router.get("/queries/:query_id", evaluationController.getResultsByQuery);
router.get("/models/:model_id", evaluationController.getResultsByModel);
router.post("/new/:query_id", evaluationController.insertNewResultByQuery);

module.exports = router;
