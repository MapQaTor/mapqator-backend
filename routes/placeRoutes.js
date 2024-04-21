const placeController = require("../controllers/placeController");

const router = require("express").Router();

router.post("/", placeController.createPlace);
router.get("/:id", placeController.getPlace);
router.get("/", placeController.getPlaces);
router.put("/:id", placeController.updatePlace);
router.delete("/:id", placeController.deletePlace);

module.exports = router;
