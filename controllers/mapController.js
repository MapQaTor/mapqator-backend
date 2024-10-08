const axios = require("axios");
const mapRepository = require("../repositories/mapRepository");
const placeRepository = require("../repositories/placeRepository");
// const geometry = require("spherical-geometry-js");
let geometry;
(async () => {
	geometry = await import("spherical-geometry-js");
	// Any code that depends on `geometry` should be placed here or in an async function
	// Example:
	// geometry.someFunction();
})();

const getSingleDistance = async (key, origin, destination, mode) => {
	const local = await mapRepository.getDistance(origin, destination, mode);
	if (local.success && local.data.length > 0) {
		return {
			distance: local.data[0].distance,
			duration: local.data[0].duration,
			status: "LOCAL",
		};
	} else if (key) {
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

const getDistanceCustom = async (req, res) => {
	const key = req.header("google_maps_api_key");
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();
	const matrix = [];
	const distanceData = await getSingleDistance(
		key,
		origin,
		destination,
		mode
	);
	if (distanceData) {
		res.status(200).send({
			matrix: [
				[
					{
						distance: distanceData.distance,
						duration: distanceData.duration,
						status: distanceData.status || "OK",
					},
				],
			],
		});
	} else {
		res.status(400).send({ error: "An error occurred" });
	}
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
			console.log(response.data);

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
				} else if (condition === "ROUTE_EXISTS") {
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

			res.status(200).send(response.data);
		} catch (error) {
			console.error(error);
			res.status(400).send({ error: "An error occurred" });
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
	const local = await mapRepository.getDirections(origin, destination, mode);
	if (local.success && local.data.length > 0) {
		return res
			.status(200)
			.send({ routes: local.data[0].routes, status: "LOCAL" });
	} else if (key) {
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
						units: "metric",
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

const getCustomDirections = async (req, res) => {
	const origin = req.query.origin;
	const destination = req.query.destination;
	const mode = req.query.mode.toLowerCase();
	const key = req.header("google_maps_api_key");
	const local = await mapRepository.getDirections(origin, destination, mode);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({
			routes: local.data[0].routes.map((route) => ({
				legs: route.legs.map((leg) => ({
					distance: leg.distance.text,
					duration: leg.duration.text,
					steps: leg.steps.map((step) => step.html_instructions),
				})),
				via: route.summary,
			})),
			status: "LOCAL",
		});
	} else if (key) {
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
			console.log(response.data);
			res.status(200).send({
				routes: details.routes.map((route) => ({
					legs: route.legs.map((leg) => ({
						distance: leg.distance.text,
						duration: leg.duration.text,
						steps: leg.steps.map((step) => step.html_instructions),
					})),
				})),
				via: route.summary,
			});
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

const formatNearbyPlace = (place) => {
	// console.log({
	// 	place_id: place.place_id,
	// 	name: place.name,
	// 	opening_hours: place.opening_hours,
	// 	price_level: place.price_level,
	// 	rating: place.rating,
	// 	user_ratings_total: place.user_ratings_total,
	// 	vicinity: place.vicinity,
	// });

	return {
		place_id: place.place_id,
		name: place.name,
		opening_hours: place.opening_hours,
		price_level: place.price_level,
		rating: place.rating,
		user_ratings_total: place.user_ratings_total,
		vicinity: place.vicinity,
		geometry: place.geometry,
	};
};

const searchNearby = async (req, res) => {
	// console.log(req.query);
	const location = req.query.location;
	const type = req.query.type;
	const keyword = req.query.keyword;
	const rankby = req.query.rankby || "prominence";
	const radius = req.query.radius || 1;
	const key = req.header("google_maps_api_key");
	if (!location) {
		return res.status(400).send({ error: "Invalid location" });
	}
	const result = await placeRepository.getPlace(location);
	if (!result.success) {
		return res.status(400).send({ error: "Invalid location" });
	}
	const place = result.data[0];
	if (!place) {
		return res.status(400).send({ error: "Invalid location" });
	}
	const loc = place.geometry.location;
	const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
	const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
	const local = await mapRepository.searchNearby(
		location,
		type || keyword,
		rankby,
		radius
	);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({
			results: local.data[0].places.map((place) =>
				formatNearbyPlace(place)
			),
			status: "LOCAL",
		});
	} else if (key) {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/nearbysearch/json",
				{
					params: {
						location: lat + "," + lng,
						type: req.query.type,
						keyword: req.query.keyword,
						radius:
							req.query.rankby === "distance"
								? undefined
								: req.query.radius,
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
				await mapRepository.addNearby(
					location,
					type || keyword,
					rankby,
					radius,
					response.data.results,
					key
				);
				res.status(200).send({
					results: response.data.results.map((place) =>
						formatNearbyPlace(place)
					),
					status: "OK",
				});
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

const searchNearbyTool = async (req, res) => {
	const location = req.query.location;
	const type = req.query.type;
	const keyword = req.query.keyword;
	const rankby = req.query.rankby || "prominence";
	const radius = req.query.radius || 1;
	const key = req.header("google_maps_api_key");
	const place = (await placeRepository.getPlace(location)).data[0];
	if (!place) {
		return res.status(400).send({ error: "Invalid location" });
	}
	const priceMap = [
		"Free",
		"Inexpensive",
		"Moderate",
		"Expensive",
		"Very Expensive",
	];
	const loc = place.geometry.location;
	const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
	const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
	const local = await mapRepository.searchNearby(
		location,
		type || keyword,
		rankby,
		radius
	);
	console.log(location, type || keyword, rankby, radius);
	if (local.success && local.data.length > 0) {
		return res.status(200).send({
			results: local.data[0].places.map((place) => ({
				place_id: place.place_id,
				name: place.name,
				opening_hours: place.opening_hours?.weekday_text ?? undefined,
				price_level: place.price_level
					? priceMap[place.price_level]
					: undefined,
				rating: place.rating,
				user_ratings_total: place.user_ratings_total,
			})),
			status: "LOCAL",
		});
	} else if (key) {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/nearbysearch/json",
				{
					params: {
						location: lat + "," + lng,
						radius: req.query.radius,
						type: req.query.type,
						keyword: req.query.keyword,
						rankby: req.query.rankby,
						key: key,
					},
				}
			);
			if (response.data.status === "INVALID_REQUEST") {
				// console.log(
				// 	{
				// 		location: lat + "," + lng,
				// 		radius: req.query.radius,
				// 		type: req.query.type,
				// 		keyword: req.query.keyword,
				// 		rankby: req.query.rankby,
				// 		key: key,
				// 	},
				// 	response.data
				// );
				res.status(400).send({ error: "An error occurred" });
			} else {
				await mapRepository.addNearby(
					location,
					type || keyword,
					rankby,
					radius,
					response.data.results,
					key
				);

				res.status(200).send({
					results: response.data.results.map((place) => ({
						place_id: place.place_id,
						name: place.name,
						opening_hours:
							place.opening_hours?.weekday_text ?? undefined,
						price_level: place.price_level
							? priceMap[place.price_level]
							: undefined,
						rating: place.rating,
						user_ratings_total: place.user_ratings_total,
					})),
				});
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
const filterNullAttributes = (obj) => {
	return Object.fromEntries(
		Object.entries(obj).filter(([_, v]) => v !== null)
	);
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
	const local = await placeRepository.getPlace(req.params.id);
	if (local.success && local.data.length > 0 && !key) {
		return res.status(200).send({ result: local.data[0], status: "LOCAL" });
	} else if (key) {
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
			console.log(response.data);
			const details = JSON.parse(JSON.stringify(response.data.result));
			// console.log(details);
			const result = await placeRepository.createPlace(details);
			const data = result.data[0];
			res.status(200).send({
				result: data,
				status: "LOCAL",
			});
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

const getDetailsCustom = async (req, res) => {
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
			const data = result.data[0];
			const priceMap = [
				"Free",
				"Inexpensive",
				"Moderate",
				"Expensive",
				"Very Expensive",
			];
			res.status(200).send({
				result: {
					place_id: data.place_id ?? undefined,
					name: data.name ?? undefined,
					formatted_address: data.formatted_address ?? undefined,
					phone_number: data.phone_number ?? undefined,
					geometry: data.geometry ?? undefined,
					price_level: data.price_level
						? priceMap[data.price_level]
						: undefined,
					opening_hours:
						data.opening_hours?.weekday_text ?? undefined,
					rating: data.rating ?? undefined,
					user_ratings_total: data.user_ratings_total ?? undefined,
					delivery: data.delivery ?? undefined,
					dine_in: data.dine_in ?? undefined,
					reservable: data.reservable ?? undefined,
					takeout: data.takeout ?? undefined,
					serves_beer: data.serves_beer ?? undefined,
					serves_breakfast: data.serves_breakfast ?? undefined,
					serves_brunch: data.serves_brunch ?? undefined,
					serves_dinner: data.serves_dinner ?? undefined,
					serves_lunch: data.serves_lunch ?? undefined,
					serves_vegetarian_food:
						data.serves_vegetarian_food ?? undefined,
					serves_wine: data.serves_wine ?? undefined,
					wheelchair_accessible_entrance:
						data.wheelchair_accessible_entrance ?? undefined,
				},
				status: "LOCAL",
			});
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

			for (const place of response.data.results) {
				await placeRepository.createPlace(place);
			}
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

// Types: https://developers.google.com/maps/documentation/places/web-service/place-types
// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText
const searchTextNew = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		console.log("Body", req.body);
		if (!req.body.query)
			return res.status(400).send({ error: "Query is required" });

		const apiCall = {
			url: "https://places.googleapis.com/v1/places:searchText",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-FieldMask":
					"places.id,places.displayName,places.shortFormattedAddress,places.formattedAddress,places.location,places.viewport",
			},
			body: {
				textQuery: req.body.query,
				maxResultCount: req.body.maxResultCount || 5,
			},
		};
		const response = await axios.post(apiCall.url, apiCall.body, {
			headers: {
				...apiCall.headers,
				"X-Goog-Api-Key": key,
			},
		});

		const epochId = Date.now();
		res.send({
			result: response.data,
			apiCallLogs: [
				{
					...apiCall,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response.data)),
				},
			],
			uuid: epochId,
		});
		const places = JSON.parse(JSON.stringify(response.data.places));
		for (const place of places) {
			placeRepository.createPlaceNew(place);
		}
	} catch (error) {
		res.status(400).send({ error: "An error occurred" });
		console.error(error);
	}
};

const getDetailsNew = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		console.log("Fetch:", req.params.id);
		const apiCall = {
			url: "https://places.googleapis.com/v1/places/" + req.params.id,
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				// "X-Goog-FieldMask":
				// 	"id,name,photos,addressComponents,adrFormatAddress,formattedAddress,location,plusCode,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,iconBackgroundColor,iconMaskBaseUri,primaryType,primaryTypeDisplayName,subDestinations,utcOffsetMinutes,currentOpeningHours,currentSecondaryOpeningHours,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours.weekdayDescriptions,regularSecondaryOpeningHours,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,editorialSummary,evChargeOptions,fuelOptions,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,parkingOptions,paymentOptions,outdoorSeating,reservable,restroom,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout,generativeSummary,areaSummary,reviews",
				"X-Goog-FieldMask":
					"id,addressComponents,adrFormatAddress,formattedAddress,location,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,primaryType,primaryTypeDisplayName,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours.weekdayDescriptions,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,outdoorSeating,reservable,restroom,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout",
			},
		};

		const response = await axios.get(apiCall.url, {
			headers: {
				...apiCall.headers,
				"X-Goog-Api-Key": key,
			},
		});
		const details = JSON.parse(JSON.stringify(response.data));
		const result = await placeRepository.createPlaceNew(details);
		const filteredResult = filterNullAttributes(result.data[0]);

		const epochId = Date.now();
		res.status(200).send({
			result: filteredResult,
			apiCallLogs: [
				{
					...apiCall,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response.data)),
				},
			],
			uuid: epochId,
		});
		// res.status(200).send({
		// 	uuid: filteredResult.id,
		// 	location: filteredResult.location,
		// 	shortFormattedAddress: filteredResult.shortFormattedAddress,
		// 	accessibilityOptions: filteredResult.accessibilityOptions,
		// 	displayName: filteredResult.displayName,
		// 	internationalPhoneNumber: filteredResult.internationalPhoneNumber,
		// 	priceLevel: filteredResult.priceLevel,
		// 	businessStatus: filteredResult.businessStatus,
		// 	rating: filteredResult.rating,
		// 	regularOpeningHours: filteredResult.regularOpeningHours,
		// 	userRatingCount: filteredResult.userRatingCount,
		// 	allowsDogs: filteredResult.allowsDogs,
		// 	delivery: filteredResult.delivery,
		// 	dineIn: filteredResult.dineIn,
		// 	paymentOptions: filteredResult.paymentOptions,
		// 	outdoorSeating: filteredResult.outdoorSeating,
		// 	reservable: filteredResult.reservable,
		// 	restroom: filteredResult.restroom,
		// 	servesBeer: filteredResult.servesBeer,
		// 	servesBreakfast: filteredResult.servesBreakfast,
		// 	servesBrunch: filteredResult.servesBrunch,
		// 	servesCocktails: filteredResult.servesCocktails,
		// 	servesCoffee: filteredResult.servesCoffee,
		// 	servesDessert: filteredResult.servesDessert,
		// 	servesDinner: filteredResult.servesDinner,
		// 	servesLunch: filteredResult.servesLunch,
		// 	servesVegetarianFood: filteredResult.servesVegetarianFood,
		// 	servesWine: filteredResult.servesWine,
		// 	takeout: filteredResult.takeout,
		// });
	} catch (error) {
		console.error(error.message);
		res.status(400).send({ error: "An error occurred" });
	}
};

// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby
const searchNearbyNew = async (req, res) => {
	console.log("New Nearby", req.body);
	const key = req.header("google_maps_api_key");
	try {
		const apiCall = {
			url: "https://places.googleapis.com/v1/places:searchText",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-FieldMask":
					"places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.shortFormattedAddress,places.userRatingCount,places.location,routingSummaries",
			},
			body: {
				textQuery:
					req.body.searchBy === "type"
						? req.body.type
						: req.body.keyword,
				rankPreference: req.body.rankPreference || "RELEVANCE", // DISTANCE/RELEVANCE/RANK_PREFERENCE_UNSPECIFIED
				includedType:
					req.body.searchBy === "type" ? req.body.type : undefined, // One type only
				minRating: req.body.minRating,
				priceLevels: req.body.priceLevels,
				maxResultCount: req.body.maxResultCount || 5,
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
				languageCode: "en",
				routingParameters: {
					origin: {
						latitude: req.body.lat,
						longitude: req.body.lng,
					},
					travelMode: "WALK",
				},
			},
		};

		console.log(apiCall.url, apiCall.body, {
			headers: {
				...apiCall.headers,
				"X-Goog-Api-Key": key,
			},
		});
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
			apiCall.url,
			apiCall.body,
			{
				headers: {
					...apiCall.headers,
					"X-Goog-Api-Key": key,
				},
			}
		);

		// Handle the response data here
		console.log(response.data);
		const epochId = Date.now();
		res.status(200).send({
			result: response.data,
			apiCallLogs: [
				{
					...apiCall,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response.data)),
				},
			],
			uuid: epochId,
		});
		const places = JSON.parse(JSON.stringify(response.data.places));

		// for (const place of places) {
		// 	console.log(
		// 		place.displayName.text,
		// 		geometry.computeDistanceBetween(
		// 			{
		// 				lat: req.body.lat,
		// 				lng: req.body.lng,
		// 			},
		// 			{
		// 				lat: place.location.latitude,
		// 				lng: place.location.longitude,
		// 			}
		// 		)
		// 	);
		// }
		// mapRepository.addNearbyNew(
		// 	req.body.locationBias,
		// 	req.body.searchBy === "type" ? req.body.type : req.body.keyword,
		// 	req.body.minRating,
		// 	req.body.priceLevels,
		// 	req.body.rankPreference,
		// 	places
		// );
	} catch (error) {
		// Handle any errors here
		res.status(400).send({ error: "An error occurred" });
		console.error(error.response.data.error);
	}
};

// https://developers.google.com/maps/documentation/routes/transit-route
const computeRoutes = async (req, res) => {
	const key = req.header("google_maps_api_key");

	const local = await mapRepository.getNewDirections(
		req.body.origin,
		req.body.destination,
		req.body.intermediates,
		req.body.travelMode,
		req.body.routeModifiers,
		req.body.optimizeWaypointOrder,
		req.body.transitPreferences
	);
	// if (local.success && local.data.length > 0) {
	// 	console.log(local.data[0].routes);
	// 	const all_routes = [];
	// 	local.data[0].routes.forEach((route) => {
	// 		all_routes.push({
	// 			description: route.description,
	// 			localizedValues: route.localizedValues,
	// 			legs: route.legs,
	// 			optimizedIntermediateWaypointIndex:
	// 				route.optimizedIntermediateWaypointIndex,
	// 		});
	// 	});
	// 	return res.status(200).send({ routes: all_routes, status: "LOCAL" });
	// } // if (local.success && local.data.length > 0) {
	// else
	if (key) {
		try {
			const apiCall = {
				url: "https://routes.googleapis.com/directions/v2:computeRoutes",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-FieldMask":
						"routes.distanceMeters,routes.staticDuration,routes.description,routes.localizedValues,routes.optimized_intermediate_waypoint_index,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.legs.localizedValues,routes.legs.steps.travelMode,routes.legs.steps.localizedValues,routes.legs.polyline,routes.polyline",
				},
				body: {
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
					extraComputations:
						req.body.travelMode === "TRANSIT"
							? []
							: ["HTML_FORMATTED_NAVIGATION_INSTRUCTIONS"],
					units: "METRIC",
					languageCode: "en",
					routingPreference:
						req.body.travelMode === "WALK" ||
						req.body.travelMode === "BICYCLE" ||
						req.body.travelMode === "TRANSIT"
							? undefined
							: "TRAFFIC_UNAWARE",
					computeAlternativeRoutes:
						req.body.intermediates.length === 0
							? req.body.computeAlternativeRoutes === undefined
								? true
								: req.body.computeAlternativeRoutes
							: false,
				},
			};

			const response = await axios.post(apiCall.url, apiCall.body, {
				headers: {
					...apiCall.headers,
					"X-Goog-Api-Key": key,
				},
			});

			const epochId = Date.now();
			res.status(200).send({
				result: response.data,
				apiCallLogs: [
					{
						...apiCall,
						uuid: epochId,
						result: JSON.parse(JSON.stringify(response.data)),
					},
				],
				uuid: epochId,
			});

			const all_routes = [];
			response.data.routes.forEach((route) => {
				all_routes.push({
					description: route.description,
					localizedValues: route.localizedValues,
					// duration: route.localizedValues.staticDuration.text,
					// distance: route.localizedValues.distance.text,
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

const searchAlongRoute = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		const apiCall1 = {
			url: "https://routes.googleapis.com/directions/v2:computeRoutes",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-FieldMask":
					"routes.distanceMeters,routes.staticDuration,routes.description,routes.localizedValues,routes.optimized_intermediate_waypoint_index,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.legs.localizedValues,routes.legs.steps.travelMode,routes.legs.steps.localizedValues,routes.legs.polyline,routes.polyline",
			},
			body: {
				origin: {
					placeId: req.body.origin,
				},
				destination: {
					placeId: req.body.destination,
				},
				travelMode: req.body.travelMode,
				intermediates: undefined,
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
				transitPreferences: undefined,
				optimizeWaypointOrder: false,
				extraComputations:
					req.body.travelMode === "TRANSIT"
						? []
						: ["HTML_FORMATTED_NAVIGATION_INSTRUCTIONS"],
				units: "METRIC",
				languageCode: "en",
				routingPreference:
					req.body.travelMode === "WALK" ||
					req.body.travelMode === "BICYCLE" ||
					req.body.travelMode === "TRANSIT"
						? undefined
						: "TRAFFIC_UNAWARE",
				computeAlternativeRoutes: false,
			},
		};

		const response1 = await axios.post(apiCall1.url, apiCall1.body, {
			headers: {
				...apiCall1.headers,
				"X-Goog-Api-Key": key,
			},
		});

		const apiCall2 = {
			url: "https://places.googleapis.com/v1/places:searchText",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-FieldMask":
					"places.id,places.displayName,places.rating,places.priceLevel,places.shortFormattedAddress,places.userRatingCount,places.location",
			},
			body: {
				textQuery:
					req.body.searchBy === "type"
						? req.body.type
						: req.body.keyword,
				rankPreference: req.body.rankPreference || "RELEVANCE", // DISTANCE/RELEVANCE/RANK_PREFERENCE_UNSPECIFIED
				includedType:
					req.body.searchBy === "type" ? req.body.type : undefined, // One type only
				minRating: req.body.minRating,
				priceLevels: req.body.priceLevels,
				maxResultCount: req.body.maxResultCount || 5,
				strictTypeFiltering: true,
				searchAlongRouteParameters: {
					polyline: {
						encodedPolyline:
							response1.data.routes[0].polyline.encodedPolyline,
					},
				},
				languageCode: "en",
			},
		};

		const response = await axios.post(apiCall2.url, apiCall2.body, {
			headers: {
				...apiCall2.headers,
				"X-Goog-Api-Key": key,
			},
		});

		// Handle the response data here
		const epochId = Date.now();
		res.status(200).send({
			route_response: response1.data,
			nearby_response: response.data,
			apiCallLogs: [
				{
					...apiCall1,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response1.data)),
				},
				{
					...apiCall2,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response.data)),
				},
			],
			uuid: epochId,
		});
		// const places = JSON.parse(JSON.stringify(response.data.places));
	} catch (error) {
		// Handle any errors here
		res.status(400).send({ error: "An error occurred" });
		console.error(error.response);
	}
};

module.exports = {
	searchNearbyNew,
	searchNearby,
	searchNearbyTool,
	searchLocalNearby,
	searchTextNew,
	searchText,
	getDetails,
	getDetailsNew,
	getDetailsCustom,
	getLocalDetails,
	getDistance,
	getDistanceCustom,
	getCustomDirections,
	getLocalDistance,
	getDirections,
	getLocalDirections,
	searchInside,
	searchLocalInside,
	computeRoutes,
	computeRouteMatrix,
	searchAlongRoute,
};
