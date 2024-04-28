const mapController = require("../controllers/mapController");

const router = require("express").Router();

router.get("/search", mapController.searchText);
router.get("/nearby", mapController.searchNearby);
router.get("/details/:id", mapController.getDetails);
router.get("/distance", mapController.getDistance);

module.exports = router;
