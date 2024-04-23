const queryController = require("../controllers/queryController");

const router = require("express").Router();

router.post("/gpt/context", queryController.getGPTContext);
router.post("/", queryController.createQuery);
router.get("/:id", queryController.getQuery);

router.get("/", queryController.getQueries);
router.put("/:id", queryController.updateQuery);
router.delete("/:id", queryController.deleteQuery);

module.exports = router;
