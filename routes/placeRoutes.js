const placeController = require("../controllers/placeController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();

// router.use(authenticateJWT);
router.post("/", placeController.createPlace);
router.get("/:id", placeController.getPlace);
router.get("/", placeController.getPlaces);
router.put("/:id", placeController.updatePlace);
router.delete("/:id", placeController.deletePlace);

module.exports = router;
