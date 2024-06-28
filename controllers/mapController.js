const axios = require("axios");

const getDistance = async (req, res) => {
	console.log(req.query.origin, req.query.destination, req.query.mode);
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/distancematrix/json",
			{
				params: {
					origins: "place_id:" + req.query.origin,
					destinations: "place_id:" + req.query.destination,
					mode: req.query.mode,
					key: process.env.GOOGLE_MAPS_API_KEY,
					language: "en",
				},
			}
		);
		// console.log(response.data);
		res.status(200).send(response.data);
	} catch (error) {
		res.status(400).send({ error: "An error occurred" });
		console.error(error.message);
	}
};

const getDirections = async (req, res) => {
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/directions/json",
			{
				params: {
					origin: "place_id:" + req.query.origin,
					destination: "place_id:" + req.query.destination,
					key: process.env.GOOGLE_MAPS_API_KEY,
					mode: req.query.mode,
					language: "en",
					alternatives: true,
				},
			}
		);
		console.log(response.data);
		res.status(200).send(response.data);
	} catch (error) {
		res.status(400).send({ error: "An error occurred" });
		console.error(error.message);
	}
};

const searchNearbyNew = async (req, res) => {
	try {
		const response = await axios.post(
			"https://places.googleapis.com/v1/places:searchNearby",
			{
				includedTypes: req.body.types,
				maxResultCount: req.body.maxResultCount,
				rankPreference: req.body.rankby, // POPULAR
				locationRestriction: {
					circle: {
						center: {
							latitude: req.body.lat,
							longitude: req.body.lng,
						},
						radius: req.body.radius,
					},
				},
			},
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
					"X-Goog-FieldMask":
						"places.id,places.displayName,places.formattedAddress",
				},
			}
		);

		// Handle the response data here
		console.log(response.data);
		res.status(200).send(response.data);
	} catch (error) {
		// Handle any errors here
		res.status(400).send({ error: "An error occurred" });
		console.error(error);
	}
};

const searchNearby = async (req, res) => {
	console.log(req.query);
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/place/nearbysearch/json",
			{
				params: {
					location: req.query.lat + "," + req.query.lng,
					radius: req.query.radius,
					type: req.query.type,
					keyword: req.query.keyword,
					rankby: req.query.rankby,
					key: process.env.GOOGLE_MAPS_API_KEY,
					language: "en",
				},
			}
		);

		console.log(response.data);
		if (response.data.status === "INVALID_REQUEST")
			res.status(400).send({ error: "An error occurred" });
		else res.status(200).send(response.data);
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

const getDetailsNew = async (req, res) => {
	try {
		const response = await axios.get(
			"https://places.googleapis.com/v1/places/" + req.params.id,
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
					"X-Goog-FieldMask":
						"id,name,photos,addressComponents,adrFormatAddress,formattedAddress,location,plusCode,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,iconBackgroundColor,iconMaskBaseUri,primaryType,primaryTypeDisplayName,subDestinations,utcOffsetMinutes,currentOpeningHours,currentSecondaryOpeningHours,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours,regularSecondaryOpeningHours,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,editorialSummary,evChargeOptions,fuelOptions,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,parkingOptions,paymentOptions,outdoorSeating,reservable,restroom,reviews,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout",
				},
			}
		);
		// console.log(response.data);
		res.status(200).send(response.data);
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

const getDetails = async (req, res) => {
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/place/details/json",
			{
				params: {
					place_id: req.params.id,
					key: process.env.GOOGLE_MAPS_API_KEY,
					language: "en",
				},
			}
		);

		console.log(response.data.result.address_components);
		res.status(200).send(response.data);
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

const searchTextNew = async (req, res) => {
	console.log(req.query.query);
	try {
		const response = await axios.post(
			"https://places.googleapis.com/v1/places:searchText",
			{
				textQuery: req.query.query,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
					// "X-Goog-FieldMask":
					// 	"places.id,places.name,places.accessibilityOptions,places.addressComponents,places.adrFormatAddress,places.businessStatus,places.displayName,places.formattedAddress,places.googleMapsUri,places.iconBackgroundColor,places.iconMaskBaseUri,places.location,places.photos,places.plusCode,places.primaryType,places.primaryTypeDisplayName,places.shortFormattedAddress,places.subDestinations,places.types,places.utcOffsetMinutes,places.viewport,places.currentOpeningHours,places.currentSecondaryOpeningHours,places.internationalPhoneNumber,places.nationalPhoneNumber,places.priceLevel,places.rating,places.regularOpeningHours,places.regularSecondaryOpeningHours,places.userRatingCount,places.websiteUri,places.allowsDogs,places.curbsidePickup,places.delivery,places.dineIn,places.editorialSummary,places.evChargeOptions,places.fuelOptions,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.menuForChildren,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.reservable,places.restroom,places.reviews,places.servesBeer,places.servesBreakfast,places.servesBrunch,places.servesCocktails,places.servesCoffee,places.servesDessert,places.servesDinner,places.servesLunch,places.servesVegetarianFood,places.servesWine,places.takeout",
					"X-Goog-FieldMask":
						"places.id,places.displayName,places.formattedAddress",
				},
			}
		);

		res.send(response.data);
	} catch (error) {
		res.status(400).send({ error: "An error occurred" });
		console.error(error);
	}
};

const searchText = async (req, res) => {
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/place/textsearch/json",
			{
				params: {
					query: req.query.query,
					key: process.env.GOOGLE_MAPS_API_KEY,
					language: "en",
				},
			}
		);

		console.log(response.data);
		res.status(200).send(response.data);
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

module.exports = {
	searchNearby,
	searchText,
	getDetails,
	getDistance,
	getDirections,
};
