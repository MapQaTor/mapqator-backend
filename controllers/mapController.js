const axios = require("axios");
const mapRepository = require("../repositories/mapRepository");
const placeRepository = require("../repositories/placeRepository");
const getDistance = async (req, res) => {
	console.log(
		req.query.origin,
		req.query.destination,
		req.query.mode.toLowerCase()
	);
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();

	const local = await mapRepository.getDistance(origin, destination, mode);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({
			rows: [
				{
					elements: [
						{
							distance: local.data[0].distance,
							duration: local.data[0].duration,
							status: "LOCAL",
						},
					],
				},
			],
		});
	} else {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/distancematrix/json",
				{
					params: {
						origins: "place_id:" + origin,
						destinations: "place_id:" + destination,
						mode: mode,
						key: process.env.GOOGLE_MAPS_API_KEY,
						language: "en",
					},
				}
			);
			const details = JSON.parse(
				JSON.stringify(response.data.rows[0].elements[0])
			);
			mapRepository.addDistance(
				origin,
				destination,
				mode,
				details.distance,
				details.duration
			);
			res.status(200).send(response.data);
		} catch (error) {
			res.status(400).send({ error: "An error occurred" });
			console.error(error.message);
		}
	}
};

const getDirections = async (req, res) => {
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();

	const local = await mapRepository.getDirections(origin, destination, mode);
	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ routes: local.data[0].routes, status: "LOCAL" });
	} else {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/directions/json",
				{
					params: {
						origin: "place_id:" + origin,
						destination: "place_id:" + destination,
						key: process.env.GOOGLE_MAPS_API_KEY,
						mode: mode,
						language: "en",
						alternatives: true,
					},
				}
			);

			const details = JSON.parse(JSON.stringify(response.data.routes));
			mapRepository.addDirections(origin, destination, mode, details);
			// console.log(response.data);
			res.status(200).send(response.data);
		} catch (error) {
			res.status(400).send({ error: "An error occurred" });
			console.error(error.message);
		}
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
	const location = req.query.location;
	const type = req.query.type || "any";
	const keyword = req.query.keyword || "";
	const rankby = req.query.rankby || "prominence";
	const radius = req.query.radius || 1;
	const local = await mapRepository.searchNearby(
		location,
		type,
		keyword,
		rankby,
		radius
	);

	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ results: local.data[0].places, status: "LOCAL" });
	} else {
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
			else {
				mapRepository.addNearby(
					location,
					type,
					keyword,
					rankby,
					radius,
					response.data.results
				);
				res.status(200).send(response.data);
			}
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
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
	const local = await placeRepository.getPlace(req.params.id);

	if (local.success && local.data.length > 0) {
		return res.status(200).send({ result: local.data[0], status: "LOCAL" });
	} else {
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
			const details = JSON.parse(JSON.stringify(response.data.result));
			// console.log(details);
			placeRepository.createPlace(details);
			res.status(200).send(response.data);
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
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

searchInside = async (req, res) => {
	const location = req.query.location;
	const type = req.query.type;
	// const name = req.query.name;
	// console.log(type + " in " + name);
	const local = await mapRepository.searchInside(location, type);

	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ results: local.data[0].places, status: "LOCAL" });
	} else {
		const place = await placeRepository.getPlace(location);
		console.log(place);
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/textsearch/json",
				{
					params: {
						query: type + " in " + place.data[0].name,
						key: process.env.GOOGLE_MAPS_API_KEY,
						language: "en",
					},
				}
			);

			if (response.data.status === "INVALID_REQUEST")
				res.status(400).send({ error: "An error occurred" });
			else {
				mapRepository.addInside(location, type, response.data.results);
				res.status(200).send(response.data);
			}
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
	}
};
module.exports = {
	searchNearby,
	searchText,
	getDetails,
	getDistance,
	getDirections,
	searchInside,
};
