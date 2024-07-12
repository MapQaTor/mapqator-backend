const mapController = require("../controllers/mapController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();
// router.use(authenticateJWT);
router.get("/search", mapController.searchText);
router.get("/directions", mapController.getDirections);
router.get("/nearby", mapController.searchNearby);
router.get("/inside", mapController.searchInside);
router.get("/details/:id", mapController.getDetails);
router.get("/details/local/:name", mapController.getLocalDetails);
router.get("/distance", mapController.getDistance);
router.get("/distance/local", mapController.getLocalDistance);

module.exports = router;
