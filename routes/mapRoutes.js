const mapController = require("../controllers/mapController");
const newMapController = require("../controllers/newMapController");
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
router.get("/directions/custom", mapController.getCustomDirections);

router.get("/nearby", mapController.searchNearby);
router.get("/nearby/tool", mapController.searchNearbyTool);
router.get("/nearby/local", mapController.searchLocalNearby);
router.get("/inside", mapController.searchInside);
router.get("/inside/local", mapController.searchLocalInside);
router.get("/details/:id", mapController.getDetails);
router.get("/details/custom/:id", mapController.getDetailsCustom);
router.get("/details/local/:name", mapController.getLocalDetails);
router.get("/distance", mapController.getDistance);
router.get("/distance/custom", mapController.getDistanceCustom);
router.get("/distance/local", mapController.getLocalDistance);

// New API
router.get("/details/new/:id", newMapController.getDetailsNew);
router.post("/search/new", newMapController.searchTextNew);
router.post("/nearby/new", newMapController.searchNearbyNew);
router.post("/directions/new", newMapController.computeRoutes);
router.post("/distance/new", mapController.computeRouteMatrix);
router.post("/search/along-route", newMapController.searchAlongRoute);
router.post("/cached", newMapController.genericCall);

module.exports = router;
