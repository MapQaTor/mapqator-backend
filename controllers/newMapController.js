const axios = require("axios");
const mapRepository = require("../repositories/mapRepository");
const placeRepository = require("../repositories/placeRepository");
const apiCallRepository = require("../repositories/apiCallRepository");
// https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
// https://developers.google.com/maps/documentation/places/web-service/data-fields

const call2 = async (url, method, headers, body, key) => {
	try {
		const cachedResponse = await apiCallRepository.get({
			url,
			method,
			headers,
			body,
		});
		if (cachedResponse.data.length > 0) {
			return { data: cachedResponse.data[0].response };
		}
		const response = await axios({
			url: url,
			method: method,
			headers: { ...headers, "X-Goog-Api-Key": key },
			data: body,
		});

		if (response.data) {
			apiCallRepository.set(
				{
					url,
					method,
					headers,
					body,
				},
				response.data
			);
		}

		return response;
	} catch (error) {
		console.error(error.response);
		return null;
	}
};

const call = async (apiCall) => {
	try {
		let apiEncoded = {
			url: apiCall.url,
			method: apiCall.method,
			headers: apiCall.headers,
			data: apiCall.data,
			params: apiCall.params,
		};

		console.log("Searching..", apiEncoded);
		const cachedResponse = await apiCallRepository.get(apiEncoded);
		if (cachedResponse.data.length > 0) {
			return { data: cachedResponse.data[0].response };
		}

		let apiCallString = JSON.stringify(apiEncoded);
		apiCallString = apiCallString.replace(
			/key:(\w+)/g,
			(match, p1) => process.env[p1]
		);
		let api = JSON.parse(apiCallString);
		// console.log("API", api);
		const response = await axios(api);

		if (response.data) {
			console.log("Saving..", apiEncoded);
			apiCallRepository.set(apiEncoded, response.data);
		}

		return response;
	} catch (error) {
		console.error(error.response);
		return null;
	}
};

const genericCall = async (req, res) => {
	const key = req.header("google_maps_api_key");
	try {
		const response = await call(req.body);
		if (!response) {
			return res.status(400).send({ error: "An error occurred" });
		}
		res.status(200).send(response.data);
	} catch (error) {
		console.error(error);
		res.status(400).send({ error: "An error occurred" });
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
		// const response = await axios.post(apiCall.url, apiCall.body, {
		// 	headers: {
		// 		...apiCall.headers,
		// 		"X-Goog-Api-Key": key,
		// 	},
		// });

		const response = await call(
			apiCall.url,
			apiCall.method,
			apiCall.headers,
			apiCall.body,
			key
		);

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
				"X-Goog-FieldMask":
					"id,addressComponents,adrFormatAddress,formattedAddress,location,shortFormattedAddress,types,viewport,accessibilityOptions,businessStatus,displayName,googleMapsUri,primaryType,primaryTypeDisplayName,internationalPhoneNumber,nationalPhoneNumber,priceLevel,rating,regularOpeningHours.weekdayDescriptions,userRatingCount,websiteUri,allowsDogs,curbsidePickup,delivery,dineIn,goodForChildren,goodForGroups,goodForWatchingSports,liveMusic,menuForChildren,outdoorSeating,reservable,restroom,servesBeer,servesBreakfast,servesBrunch,servesCocktails,servesCoffee,servesDessert,servesDinner,servesLunch,servesVegetarianFood,servesWine,takeout",
			},
		};

		// const response = await axios.get(apiCall.url, {
		// 	headers: {
		// 		...apiCall.headers,
		// 		"X-Goog-Api-Key": key,
		// 	},
		// });

		const response = await call(
			apiCall.url,
			apiCall.method,
			apiCall.headers,
			undefined,
			key
		);

		const details = JSON.parse(JSON.stringify(response.data));
		// const result = await placeRepository.createPlaceNew(details);
		// const filteredResult = filterNullAttributes(result.data[0]);

		const epochId = Date.now();
		res.status(200).send({
			result: details,
			apiCallLogs: [
				{
					...apiCall,
					uuid: epochId,
					result: JSON.parse(JSON.stringify(response.data)),
				},
			],
			uuid: epochId,
		});
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

		// const response = await axios.post(apiCall.url, apiCall.body, {
		// 	headers: {
		// 		...apiCall.headers,
		// 		"X-Goog-Api-Key": key,
		// 	},
		// });

		const response = await call(
			apiCall.url,
			apiCall.method,
			apiCall.headers,
			apiCall.body,
			key
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
	} catch (error) {
		// Handle any errors here
		res.status(400).send({ error: "An error occurred" });
		console.error(error.response.data);
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

			// const response = await axios.post(apiCall.url, apiCall.body, {
			// 	headers: {
			// 		...apiCall.headers,
			// 		"X-Goog-Api-Key": key,
			// 	},
			// });

			const response = await call(
				apiCall.url,
				apiCall.method,
				apiCall.headers,
				apiCall.body,
				key
			);

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

		// const response1 = await axios.post(apiCall1.url, apiCall1.body, {
		// 	headers: {
		// 		...apiCall1.headers,
		// 		"X-Goog-Api-Key": key,
		// 	},
		// });

		const response1 = await call(
			apiCall1.url,
			apiCall1.method,
			apiCall1.headers,
			apiCall1.body,
			key
		);

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

		// const response = await axios.post(apiCall2.url, apiCall2.body, {
		// 	headers: {
		// 		...apiCall2.headers,
		// 		"X-Goog-Api-Key": key,
		// 	},
		// });

		const response = await call(
			apiCall2.url,
			apiCall2.method,
			apiCall2.headers,
			apiCall2.body,
			key
		);

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
	searchTextNew,
	getDetailsNew,
	searchNearbyNew,
	computeRoutes,
	searchAlongRoute,
	genericCall,
};
