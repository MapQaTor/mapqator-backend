const axios = require("axios");
const mapRepository = require("../repositories/mapRepository");
const placeRepository = require("../repositories/placeRepository");

const getSingleDistance = async (key, origin, destination, mode) => {
	// const local = await mapRepository.getDistance(origin, destination, mode);
	// if (local.success && local.data.length > 0) {
	// 	return {
	// 		distance: local.data[0].distance,
	// 		duration: local.data[0].duration,
	// 		status: "LOCAL",
	// 	};
	// } else
	if (key) {
		try {
			console.log(origin, destination, mode);
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/distancematrix/json",
				{
					params: {
						origins: "place_id:" + origin,
						destinations: "place_id:" + destination,
						mode: mode,
						key: key,
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

			return details;
		} catch (error) {
			console.error(error.message);
			return null;
		}
	} else {
		return null;
	}
};

const getLocalDistance = async (req, res) => {
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();
	const local = await mapRepository.getDistanceByNames(
		origin,
		destination,
		mode
	);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({
			matrix: [
				[
					{
						distance: local.data[0].distance,
						duration: local.data[0].duration,
					},
				],
			],
			status: "LOCAL",
		});
	} else {
		return res.status(400).send({ error: "An error occurred" });
	}
};

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes#Route

const getDistance = async (req, res) => {
	console.log(
		req.query.origin,
		req.query.destination,
		req.query.mode.toLowerCase()
	);
	const key = req.header("google_maps_api_key");
	const origin = req.query.origin.split(",");
	const destination = req.query.destination.split(",");
	const mode = req.query.mode.toLowerCase();
	const matrix = [];
	for (let i = 0; i < origin.length; i++) {
		const o = origin[i];
		const row = [];
		for (let j = 0; j < destination.length; j++) {
			const d = destination[j];
			if (o === d) {
				row.push({
					distance: { text: "0 km", value: 0 },
					duration: { text: "0 mins", value: 0 },
					status: "LOCAL",
				});
			} else {
				const distanceData = await getSingleDistance(key, o, d, mode);
				if (distanceData)
					row.push({
						distance: distanceData.distance,
						duration: distanceData.duration,
						status: distanceData.status || "OK",
					});
				else row.push(null);
			}
		}
		matrix.push(row);
	}
	console.log(matrix);
	res.status(200).send({ matrix: matrix });
};

const getLocalDirections = async (req, res) => {
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();
	const local = await mapRepository.getDirectionsByNames(
		origin,
		destination,
		mode
	);
	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ routes: local.data[0].routes, status: "LOCAL" });
	} else {
		return res.status(400).send({ error: "An error occurred" });
	}
};

// routeModifiers: {
// 	avoidTolls: true,
// 	avoidHighways: false,
// 	avoidFerries: false,
// 	avoidIndoor: false,
// },

// https://developers.google.com/maps/documentation/routes/transit-route
const computeRoutes = async (req, res) => {
	const key = req.header("google_maps_api_key");

	if (key) {
		try {
			const response = await axios.post(
				"https://routes.googleapis.com/directions/v2:computeRoutes",
				{
					origin: {
						placeId: req.body.origin,
					},
					destination: {
						placeId: req.body.destination,
					},
					travelMode: req.body.travelMode,
					intermediates:
						req.body.travelMode !== "TRANSIT"
							? req.body.intermediates.map((intermediate) => ({
									placeId: intermediate,
							  }))
							: undefined,
					routeModifiers: {
						avoidTolls: ["DRIVE", "TWO_WHEELER"].includes(
							req.body.travelMode
						)
							? req.body.routeModifiers.avoidTolls
							: false,
						avoidHighways: ["DRIVE", "TWO_WHEELER"].includes(
							req.body.travelMode
						)
							? req.body.routeModifiers.avoidHighways
							: false,
						avoidFerries: ["DRIVE", "TWO_WHEELER"].includes(
							req.body.travelMode
						)
							? req.body.routeModifiers.avoidFerries
							: false,
						avoidIndoor: false,
					},
					transitPreferences:
						req.body.travelMode === "TRANSIT"
							? req.body.transitPreferences
							: undefined,
					optimizeWaypointOrder:
						req.body.intermediates.length > 0 &&
						req.body.travelMode !== "TRANSIT"
							? req.body.optimizeWaypointOrder
							: false,
					// extraComputations: [
					// 	"HTML_FORMATTED_NAVIGATION_INSTRUCTIONS",
					// ],
					units: "METRIC",
					languageCode: "en",
					routingPreference:
						req.body.travelMode === "WALK" ||
						req.body.travelMode === "BICYCLE" ||
						req.body.travelMode === "TRANSIT"
							? undefined
							: "TRAFFIC_UNAWARE",
					computeAlternativeRoutes:
						req.body.intermediates.length === 0,
				},
				{
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": key,
						"X-Goog-FieldMask":
							"routes.distanceMeters,routes.staticDuration,routes.description,routes.localizedValues,routes.optimized_intermediate_waypoint_index,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.legs.localizedValues,routes.legs.steps.travelMode,routes.legs.steps.localizedValues",
					},
				}
			);
			res.status(200).send(response.data);

			const all_routes = [];
			response.data.routes.forEach((route) => {
				all_routes.push({
					label: route.description,
					duration: route.localizedValues.staticDuration.text,
					distance: route.localizedValues.distance.text,
					legs: route.legs,
					optimizedIntermediateWaypointIndex:
						route.optimizedIntermediateWaypointIndex,
				});
			});
			mapRepository.addNewDirections(
				req.body.origin,
				req.body.destination,
				req.body.intermediates,
				req.body.travelMode,
				req.body.routeModifiers,
				req.body.optimizeWaypointOrder,
				req.body.transitPreferences,
				all_routes
			);
		} catch (error) {
			res.status(400).send({ error: "An error occurred" });
			console.error(error.message);
		}
	} else {
		res.status(400).send({
			error: "Can't find direction in the local database",
		});
	}
};

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRouteMatrix
const computeRouteMatrix = async (req, res) => {
	const key = req.header("google_maps_api_key");
	// console.log({
	// 	origins: req.body.origins.map((origin) => ({
	// 		waypoint: {
	// 			placeId: origin,
	// 		},
	// 	})),
	// 	destinations: req.body.destinations.map((destination) => ({
	// 		waypoint: {
	// 			placeId: destination,
	// 		},
	// 	})),
	// 	travelMode: req.body.travelMode,
	// 	routingPreference: "TRAFFIC_UNAWARE",
	// 	units: "METRIC",
	// 	transitPreferences: {},
	// 	languageCode: "en",
	// });
	// console.log(
	// 	req.body.origins.map((origin) => ({
	// 		waypoint: {
	// 			placeId: origin,
	// 		},
	// 	}))
	// );
	if (key) {
		try {
			const response = await axios.post(
				"https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
				{
					origins: req.body.origins.map((origin) => ({
						waypoint: {
							placeId: origin,
						},
					})),
					destinations: req.body.destinations.map((destination) => ({
						waypoint: {
							placeId: destination,
						},
					})),
					travelMode: req.body.travelMode,
					routingPreference:
						req.body.travelMode === "WALK" ||
						req.body.travelMode === "BICYCLE" ||
						req.body.travelMode === "TRANSIT"
							? undefined
							: "TRAFFIC_UNAWARE",
					units: "METRIC",
					transitPreferences: {},
					languageCode: "en",
				},
				{
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": key,
						"X-Goog-FieldMask":
							"originIndex,destinationIndex,condition,localizedValues",
					},
				}
			);
			res.status(200).send(response.data);

			for (const route of response.data) {
				const {
					originIndex,
					destinationIndex,
					condition,
					localizedValues,
				} = route;

				const o = req.body.origins[originIndex];
				const d = req.body.destinations[destinationIndex];
				if (o === d) {
					continue;
				}

				if (condition === "ROUTE_NOT_FOUND") {
					mapRepository.addNewDistance(
						o,
						d,
						req.body.travelMode,
						null,
						null
					);
				} else {
					const distance = localizedValues.distance.text;
					const duration = localizedValues.staticDuration.text;
					mapRepository.addNewDistance(
						o,
						d,
						req.body.travelMode,
						distance,
						duration
					);
				}
			}
		} catch (error) {
			res.status(400).send({ error: "An error occurred" });
			console.error(error);
		}
	} else {
		res.status(400).send({
			error: "Can't find direction in the local database",
		});
	}
};

const getDirections = async (req, res) => {
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();
	const key = req.header("google_maps_api_key");
	// const local = await mapRepository.getDirections(origin, destination, mode);
	// if (local.success && local.data.length > 0) {
	// 	return res
	// 		.status(200)
	// 		.send({ routes: local.data[0].routes, status: "LOCAL" });
	// } else
	if (key) {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/directions/json",
				{
					params: {
						origin: "place_id:" + origin,
						destination: "place_id:" + destination,
						key: key,
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
	} else {
		res.status(400).send({
			error: "Can't find direction in the local database",
		});
	}
};

// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby
const searchNearbyNew = async (req, res) => {
	console.log("New Nearby", req.body);
	const key = req.header("google_maps_api_key");
	try {
		const response = await axios.post(
			// "https://places.googleapis.com/v1/places:searchNearby",
			// {
			// 	includedTypes: req.body.types,
			// 	maxResultCount: req.body.maxResultCount,
			// 	rankPreference: req.body.rankby, // POPULARITY/DISTANCE
			// 	locationRestriction: {
			// 		circle: {
			// 			center: {
			// 				latitude: req.body.lat,
			// 				longitude: req.body.lng,
			// 			},
			// 			radius: req.body.radius,
			// 		},
			// 	},
			// },
			// type, minRating, priceLevels, rankPreference, locationBias
			"https://places.googleapis.com/v1/places:searchText",
			{
				textQuery:
					req.body.searchBy === "type"
						? req.body.type
						: req.body.keyword,
				rankPreference: req.body.rankPreference || "RELEVANCE", // DISTANCE/RELEVANCE/RANK_PREFERENCE_UNSPECIFIED
				includedType:
					req.body.searchBy === "type" ? req.body.type : undefined, // One type only
				minRating: req.body.minRating,
				priceLevels: req.body.priceLevels,
				maxResultCount: req.body.maxResultCount || 10,
				strictTypeFiltering: true,
				locationBias: {
					circle: {
						center: {
							latitude: req.body.lat,
							longitude: req.body.lng,
						},
						radius: 0,
					},
				},
			},
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": key,
					"X-Goog-FieldMask":
						"places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.shortFormattedAddress,places.userRatingCount",
				},
			}
		);

		// Handle the response data here
		console.log(response.data);
		res.status(200).send(response.data);
		const places = JSON.parse(JSON.stringify(response.data.places));
		mapRepository.addNearbyNew(
			req.body.locationBias,
			req.body.searchBy === "type" ? req.body.type : req.body.keyword,
			req.body.minRating,
			req.body.priceLevels,
			req.body.rankPreference,
			places
		);
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
	const key = req.header("google_maps_api_key");
	// const local = await mapRepository.searchNearby(
	// 	location,
	// 	type,
	// 	keyword,
	// 	rankby,
	// 	radius
	// );
	// if (local.success && local.data.length > 0) {
	// 	return res
	// 		.status(200)
	// 		.send({ results: local.data[0].places, status: "LOCAL" });
	// } else
	if (key) {
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
						key: key,
						language: "en",
					},
				}
			);

			// console.log(response.data);
			if (response.data.status === "INVALID_REQUEST")
				res.status(400).send({ error: "An error occurred" });
			else {
				mapRepository.addNearby(
					location,
					type,
					keyword,
					rankby,
					radius,
					response.data.results,
					key
				);
				res.status(200).send(response.data);
			}
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
	} else {
		res.status(400).send({
			error: "Can't find nearby places in the local database",
		});
	}
};

const searchLocalNearby = async (req, res) => {
	const location = req.query.location;
	const type = req.query.type || "any";
	const keyword = req.query.keyword || "";
	const rankby = req.query.rankby || "prominence";
	const radius = req.query.radius || 1;
	const local = await mapRepository.searchNearbyByName(
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
		return res.status(400).send({ error: "An error occurred" });
	}
};

// PriceLevel: PRICE_LEVEL_UNSPECIFIED,
// 	PRICE_LEVEL_FREE,
// 	PRICE_LEVEL_INEXPENSIVE,
// 	PRICE_LEVEL_MODERATE,
// 	PRICE_LEVEL_EXPENSIVE,
// 	PRICE_LEVEL_VERY_EXPENSIVE;
// BusinessStatus: BUSINESS_STATUS_UNSPECIFIED,
// 	OPERATIONAL,
// 	CLOSED_TEMPORARILY,
// 	CLOSED_PERMANENTLY;

// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
// https://developers.google.com/maps/documentation/places/web-service/data-fields
const getDetailsNew = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		console.log("Fetch:", req.params.id);
		const response = await axios.get(
			"https://places.googleapis.com/v1/places/" + req.params.id,
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": key,
					// "X-Goog-FieldMask":
					// 	"id,name,photos,addressComponents,adrFormatAddress,formattedAddress,location,plusCode,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,iconBackgroundColor,iconMaskBaseUri,primaryType,primaryTypeDisplayName,subDestinations,utcOffsetMinutes,currentOpeningHours,currentSecondaryOpeningHours,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours,regularSecondaryOpeningHours,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,editorialSummary,evChargeOptions,fuelOptions,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,parkingOptions,paymentOptions,outdoorSeating,reservable,restroom,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout,generativeSummary,areaSummary,reviews",
					"X-Goog-FieldMask":
						"id,name,addressComponents,adrFormatAddress,formattedAddress,location,plusCode,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,iconBackgroundColor,iconMaskBaseUri,primaryType,primaryTypeDisplayName,subDestinations,utcOffsetMinutes,currentOpeningHours,currentSecondaryOpeningHours,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours,regularSecondaryOpeningHours,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,editorialSummary,evChargeOptions,fuelOptions,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,parkingOptions,paymentOptions,outdoorSeating,reservable,restroom,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout,generativeSummary,areaSummary",
				},
			}
		);
		const details = JSON.parse(JSON.stringify(response.data));
		console.log(details);
		const result = await placeRepository.createPlaceNew(details);
		res.status(200).send(result.data[0]);
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

const getLocalDetails = async (req, res) => {
	const local = await placeRepository.getPlaceByName(req.params.name);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({ result: local.data[0], status: "LOCAL" });
	} else {
		res.status(400).send({ error: "Not Found" });
	}
};

const getDetails = async (req, res) => {
	const key = req.header("google_maps_api_key");
	// const local = await placeRepository.getPlace(req.params.id);
	// if (
	// 	local.success &&
	// 	local.data.length > 0 &&
	// 	(!key || local.data[0].last_updated)
	// ) {
	// 	return res.status(200).send({ result: local.data[0], status: "LOCAL" });
	// } else
	if (key) {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/details/json",
				{
					params: {
						place_id: req.params.id,
						key: key,
						language: "en",
					},
				}
			);
			const details = JSON.parse(JSON.stringify(response.data.result));
			// console.log(details);
			const result = await placeRepository.createPlace(details);
			console.log(result);
			res.status(200).send({ result: result.data[0], status: "LOCAL" });
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
	} else {
		res.status(400).send({
			error: "Can't find the place in the local database",
		});
	}
};

// Types: https://developers.google.com/maps/documentation/places/web-service/place-types
// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText
const searchTextNew = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		console.log("Body", req.body);
		if (!req.body.query)
			return res.status(400).send({ error: "Query is required" });
		const response = await axios.post(
			"https://places.googleapis.com/v1/places:searchText",
			{
				textQuery: req.body.query,
				// rankPreference: req.query.rankby , // DISTANCE/RELEVANCE/RANK_PREFERENCE_UNSPECIFIED
				// For a categorical query such as "Restaurants in New York City", RELEVANCE is the default. For non-categorical queries such as "Mountain View, CA" we recommend that you leave rankPreference unset.
				maxResultCount: req.body.maxResultCount || 10,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": key,
					"X-Goog-FieldMask":
						"places.id,places.displayName,places.shortFormattedAddress,places.formattedAddress",
				},
			}
		);
		console.log(response.data);
		res.send(response.data);
		const places = JSON.parse(JSON.stringify(response.data.places));
		for (const place of places) {
			placeRepository.createPlaceNew(place);
		}
	} catch (error) {
		res.status(400).send({ error: "An error occurred" });
		console.error(error);
	}
};

const searchText = async (req, res) => {
	const key = req.header("google_maps_api_key");
	if (key) {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/textsearch/json",
				{
					params: {
						query: req.query.query,
						key: key,
						language: "en",
					},
				}
			);

			// console.log(response.data);
			res.status(200).send(response.data);
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
	} else if (local.success && local.data.length > 0) {
		const local = await mapRepository.searchText(req.query.query);
		console.log(local.data);
		res.status(200).send({ results: local.data });
		// res.status(400).send({
		// 	error: "User is not authorized to use the Google Maps API",
		// });
	}
};

const searchInside = async (req, res) => {
	const location = req.query.location;
	const type = req.query.type;
	// const name = req.query.name;
	// console.log(type + " in " + name);
	const key = req.header("google_maps_api_key");

	const local = await mapRepository.searchInside(location, type);
	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ results: local.data[0].places, status: "LOCAL" });
	} else if (key) {
		const place = await placeRepository.getPlace(location);
		console.log(place);
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/textsearch/json",
				{
					params: {
						query: type + " in " + place.data[0].name,
						key: key,
						language: "en",
					},
				}
			);

			if (response.data.status === "INVALID_REQUEST")
				res.status(400).send({ error: "An error occurred" });
			else {
				mapRepository.addInside(
					location,
					type,
					response.data.results,
					key
				);
				res.status(200).send(response.data);
			}
		} catch (error) {
			console.error(error.message);
			res.status(400).send({ error: "An error occurred" });
		}
	} else {
		res.status(400).send({
			error: "Can't find places inside in the local database",
		});
	}
};

const searchLocalInside = async (req, res) => {
	const location = req.query.location;
	const type = req.query.type;
	const local = await mapRepository.searchInsideByName(location, type);
	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ results: local.data[0].places, status: "LOCAL" });
	} else {
		return res.status(400).send({ error: "An error occurred" });
	}
};

module.exports = {
	searchNearbyNew,
	searchNearby,
	searchLocalNearby,
	searchTextNew,
	searchText,
	getDetails,
	getDetailsNew,
	getLocalDetails,
	getDistance,
	getLocalDistance,
	getDirections,
	getLocalDirections,
	searchInside,
	searchLocalInside,
	computeRoutes,
	computeRouteMatrix,
};
