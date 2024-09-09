const base = require("./base");
const axios = require("axios");
const placeRepository = require("./placeRepository");

function convertQueryToAndSeparatedString(query) {
	// Split the query into words, filter out empty strings, and join with '&'
	return query.split(/\s+/).filter(Boolean).join(" & ");
}

const searchText = async (text) => {
	const query = `
		SELECT p.place_id, p.name, p.formatted_address, ts_rank_cd(p.search_vector, to_tsquery('simple_ts_config', $1)) AS rank
		FROM places p
		WHERE p.search_vector @@ to_tsquery('simple_ts_config', $1)
		ORDER BY rank DESC
	`;
	const params = [convertQueryToAndSeparatedString(text)];
	const result = await base.query(query, params);
	return result;
};

const getDistance = async (origin, destination, mode) => {
	const query = `
        SELECT *
        FROM distance
        WHERE from_id = $1 AND to_id = $2 AND mode = $3
    `;
	const params = [origin, destination, mode];
	const result = await base.query(query, params);
	return result;
};
const getDistanceByNames = async (origin, destination, mode) => {
	console.log(origin, destination, mode);
	const query = `
		SELECT *
		FROM distance
		WHERE from_id = (SELECT place_id FROM places WHERE name = $1) AND to_id = (SELECT place_id FROM places WHERE name = $2) AND mode = $3
	`;
	const params = [origin, destination, mode];
	const result = await base.query(query, params);
	return result;
};

const getDirectionsByNames = async (origin, destination, mode) => {
	const query = `
		SELECT *
		FROM directions
		WHERE from_id = (SELECT place_id FROM places WHERE name = $1) AND to_id = (SELECT place_id FROM places WHERE name = $2) AND mode = $3
	`;
	const params = [origin, destination, mode];
	const result = await base.query(query, params);
	return result;
};

const addDistance = async (origin, destination, mode, distance, duration) => {
	const query = `
        INSERT INTO distance (from_id, to_id, mode, distance, duration)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
	const params = [origin, destination, mode, distance, duration];
	const result = await base.query(query, params);
	return result;
};

const addNewDistance = async (
	origin,
	destination,
	mode,
	distance,
	duration
) => {
	const query = `
		INSERT INTO new_distance ("origin", "destination", "travelMode", "distance", "duration")
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ("origin", "destination", "travelMode") DO NOTHING
		RETURNING *
	`;
	const params = [origin, destination, mode, distance, duration];
	const result = await base.query(query, params);
	return result;
};

const getDirections = async (origin, destination, mode) => {
	const query = `
        SELECT *
        FROM directions
        WHERE from_id = $1 AND to_id = $2 AND mode = $3
    `;
	const params = [origin, destination, mode];
	const result = await base.query(query, params);
	return result;
};

const getNewDirections = async (
	origin,
	destination,
	intermediates,
	travelMode,
	routeModifiers,
	optimizeWaypointOrder,
	transitPreferences
) => {
	const query = `
		SELECT routes
		FROM new_directions
		WHERE "origin" = $1 AND "destination" = $2 AND "intermediates" = $3 AND "travelMode" = $4 AND "routeModifiers" = $5 AND "optimizeWaypointOrder" = $6 AND "transitPreferences" = $7
	`;
	const params = [
		origin,
		destination,
		intermediates,
		travelMode,
		routeModifiers,
		optimizeWaypointOrder,
		transitPreferences,
	];
	const result = await base.query(query, params);
	return result;
};

const addDirections = async (origin, destination, mode, directions) => {
	const query = `
        INSERT INTO directions (from_id, to_id, mode, routes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
	const params = [origin, destination, mode, directions];
	const result = await base.query(query, params);
	return result;
};

const addNewDirections = async (
	origin,
	destination,
	intermediates,
	travelMode,
	routeModifiers,
	optimizeWaypointOrder,
	transitPreferences,
	routes
) => {
	const query = `
		INSERT INTO new_directions ("origin", "destination", "intermediates", "travelMode", "routeModifiers", "optimizeWaypointOrder", "transitPreferences", "routes")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING *
	`;
	const params = [
		origin,
		destination,
		intermediates,
		travelMode,
		routeModifiers,
		optimizeWaypointOrder,
		transitPreferences,
		routes,
	];
	const result = await base.query(query, params);

	return result;
};

const searchNearby = async (location, type, rankby, radius) => {
	const query = `
        SELECT N.location, N.type, N.keyword, N.rankby, N.radius, json_agg(json_build_object(
            'place_id', P.place_id,
            'name', P.name,
            'vicinity', P.formatted_address
        )) AS places
        FROM nearby N
        JOIN nearby_places NP ON NP.nearby_id = N.id
        JOIN places P ON P.place_id = NP.place_id
        WHERE location = $1 AND type = $2 AND rankby = $3 AND radius = $4
        GROUP BY N.id, N.location, N.type, N.keyword, N.rankby, N.radius
    `;
	const params = [location, type, rankby, radius];
	const result = await base.query(query, params);
	return result;
};

const searchNearbyByName = async (location, type, keyword, rankby, radius) => {
	const query = `
		SELECT N.location, N.type, N.keyword, N.rankby, N.radius, json_agg(json_build_object(
			'place_id', P.place_id,
			'name', P.name,
			'vicinity', P.formatted_address
		)) AS places
		FROM nearby N
		JOIN nearby_places NP ON NP.nearby_id = N.id
		JOIN places P ON P.place_id = NP.place_id
		WHERE location = (SELECT place_id FROM places WHERE name = $1) AND type = $2 AND keyword = $3 AND rankby = $4 AND radius = $5
		GROUP BY N.id, N.location, N.type, N.keyword, N.rankby, N.radius
	`;
	const params = [location, type, keyword, rankby, radius];
	const result = await base.query(query, params);
	return result;
};

const getDetails = async (place_id, api_key) => {
	const local = await placeRepository.getPlace(place_id);
	if (local.success && local.data.length > 0 && local.data[0].last_updated) {
		return local.data[0];
	} else {
		try {
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/place/details/json",
				{
					params: {
						place_id: place_id,
						key: api_key,
						language: "en",
					},
				}
			);
			const details = JSON.parse(JSON.stringify(response.data.result));
			await placeRepository.createPlace(details);
			return response.data;
		} catch (error) {
			console.error(error.message);
			return null;
		}
	}
};

const addNearby = async (location, type, rankby, radius, places, api_key) => {
	try {
		await base.startTransaction();
		const query = `
            INSERT INTO nearby (location, type, rankby, radius)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
		const params = [location, type, rankby, radius];
		const result = await base.query(query, params);

		if (!result.success || result.data.length === 0) {
			await base.rollbackTransaction();
			return result;
		}

		const nearbyId = result.data[0].id;
		const placeQuery = `
            INSERT INTO nearby_places (nearby_id, place_id)
            VALUES ($1, $2)
        `;

		for (const place of places) {
			const placeParams = [nearbyId, place.place_id];
			const details = await getDetails(place.place_id, api_key);

			if (details) {
				const res = await base.query(placeQuery, placeParams);
				if (!res.success) {
					await base.rollbackTransaction();
					return {
						success: false,
						message: "Error adding nearby places",
					};
				}
			} else {
				console.error(
					`Error fetching details for place_id: ${place.place_id}`
				);
			}
		}

		await base.endTransaction();
		return result;
	} catch (error) {
		await base.rollbackTransaction();
		console.error("Transaction failed:", error);
		return { success: false, message: "Transaction failed", error };
	}
};

const addNearbyNew = async (
	locationBias,
	type,
	minRating,
	priceLevels,
	rankPreference,
	places
) => {
	await base.startTransaction();
	const query = `
		INSERT INTO new_nearby ("locationBias", "type", "minRating", "priceLevels", "rankPreference")
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ("locationBias", "type", "minRating", "priceLevels", "rankPreference") DO NOTHING
		RETURNING *
	`;
	const params = [locationBias, type, minRating, priceLevels, rankPreference];
	const result = await base.query(query, params);
	if (!result.success || result.data.length === 0) return result;
	const nearbyId = result.data[0].id;
	const placeQuery = `
        INSERT INTO new_nearby_places (nearby_id, place_id)
        VALUES ($1, $2)
		ON CONFLICT ("nearby_id", "place_id") DO NOTHING
    `;
	for (const place of places) {
		const placeParams = [nearbyId, place.id];
		if (await placeRepository.createPlaceNew(place)) {
			const res = await base.query(placeQuery, placeParams);
			if (!res.success) {
				await base.rollbackTransaction();
				return null;
			}
		} else {
			console.error("Error adding nearby places");
		}
	}
	await base.endTransaction();
	return result;
};

const searchInside = async (location, type) => {
	const query = `
        SELECT I.location, I.type, json_agg(json_build_object(
            'place_id', P.place_id,
            'name', P.name,
            'formatted_address', P.formatted_address
        )) AS places
        FROM inside I
        JOIN inside_places IP ON IP.inside_id = I.id
        JOIN places P ON P.place_id = IP.place_id
        WHERE location = $1 AND type = $2
        GROUP BY I.location, I.type
    `;
	const params = [location, type];
	const result = await base.query(query, params);
	return result;
};

const searchInsideByName = async (location, type) => {
	const query = `
		SELECT I.location, I.type, json_agg(json_build_object(
			'place_id', P.place_id,
			'name', P.name,
			'formatted_address', P.formatted_address
		)) AS places
		FROM inside I
		JOIN inside_places IP ON IP.inside_id = I.id
		JOIN places P ON P.place_id = IP.place_id
		WHERE location = (SELECT place_id FROM places WHERE name = $1) AND type = $2
		GROUP BY I.location, I.type
	`;
	const params = [location, type];
	const result = await base.query(query, params);
	return result;
};

const addInside = async (location, type, places, api_key) => {
	await base.startTransaction();
	const query = `
        INSERT INTO inside (location, type)
        VALUES ($1, $2)
        RETURNING *
    `;
	const params = [location, type];
	const result = await base.query(query, params);
	if (!result.success || result.data.length === 0) return result;

	const insideId = result.data[0].id;
	const placeQuery = `
        INSERT INTO inside_places (inside_id, place_id)
        VALUES ($1, $2)
    `;
	for (const place of places) {
		const placeParams = [insideId, place.place_id];
		if (await getDetails(place.place_id, api_key)) {
			const res = await base.query(placeQuery, placeParams);
			if (!res.success) {
				await base.rollbackTransaction();
				return null;
			}
		} else {
			console.error("Error adding inside places");
		}
	}
	await base.endTransaction();
	return result;
};

module.exports = {
	getDistance,
	getDirections,
	addDirections,
	addDistance,
	searchNearby,
	searchNearbyByName,
	addNearby,
	searchInside,
	searchInsideByName,
	addInside,
	getDistanceByNames,
	getDirectionsByNames,
	searchText,
	addNearbyNew,
	addNewDistance,
	addNewDirections,
	getNewDirections,
};
