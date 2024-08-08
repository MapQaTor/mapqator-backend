const mapController = require("../controllers/mapController");
const {
	authenticateJWT,
	authenticateOrGuest,
} = require("../middlewares/authMiddleware");
const router = require("express").Router();

const setGoogleMapApiKey = (req, res, next) => {
	if (!req.header("google_maps_api_key")) {
		const apiKey = process.env.GOOGLE_MAPS_API_KEY;
		if (apiKey) {
			req.headers["google_maps_api_key"] = apiKey;
		}
	}
	next();
};

router.use(authenticateOrGuest);
router.use(setGoogleMapApiKey);

router.get("/search", mapController.searchText);
router.get("/directions", mapController.getDirections);
router.get("/directions/local", mapController.getLocalDirections);

router.get("/nearby", mapController.searchNearby);
router.get("/nearby/local", mapController.searchLocalNearby);
router.get("/inside", mapController.searchInside);
router.get("/inside/local", mapController.searchLocalInside);
router.get("/details/:id", mapController.getDetails);
router.get("/details/local/:name", mapController.getLocalDetails);
router.get("/distance", mapController.getDistance);
router.get("/distance/local", mapController.getLocalDistance);

// New API
router.get("/details/new/:id", mapController.getDetailsNew);
router.post("/search/new", mapController.searchTextNew);
router.post("/nearby/new", mapController.searchNearbyNew);
router.post("/directions/new", mapController.computeRoutes);
router.post("/distance/new", mapController.computeRouteMatrix);

module.exports = router;
