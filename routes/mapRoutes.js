const mapController = require("../controllers/mapController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = require("express").Router();
router.use(authenticateJWT);
router.get("/search", mapController.searchText);
router.get("/directions", mapController.getDirections);
router.get("/nearby", mapController.searchNearby);
router.get("/details/:id", mapController.getDetails);
router.get("/distance", mapController.getDistance);

module.exports = router;
