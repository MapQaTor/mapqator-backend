const base = require("./base");
const dataFields = require("../database/dataFields.json");
const createPlace = async (place) => {
	const query = `
		INSERT INTO places (place_id, name, formatted_address, geometry, opening_hours, rating, reviews, price_level, types, user_ratings_total, delivery, dine_in, reservable, serves_beer, serves_breakfast, serves_brunch, serves_dinner, serves_lunch, serves_vegetarian_food, serves_wine, takeout, wheelchair_accessible_entrance, vicinity, phone_number, last_updated) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW()) 
		ON CONFLICT (place_id) DO UPDATE SET 
		name = EXCLUDED.name, 
		formatted_address = EXCLUDED.formatted_address, 
		geometry = EXCLUDED.geometry, 
		opening_hours = EXCLUDED.opening_hours, 
		rating = EXCLUDED.rating, 
		reviews = EXCLUDED.reviews, 
		price_level = EXCLUDED.price_level, 
		types = EXCLUDED.types, 
		user_ratings_total = EXCLUDED.user_ratings_total, 
		delivery = EXCLUDED.delivery, 
		dine_in = EXCLUDED.dine_in, 
		reservable = EXCLUDED.reservable, 
		serves_beer = EXCLUDED.serves_beer, 
		serves_breakfast = EXCLUDED.serves_breakfast, 
		serves_brunch = EXCLUDED.serves_brunch, 
		serves_dinner = EXCLUDED.serves_dinner, 
		serves_lunch = EXCLUDED.serves_lunch, 
		serves_vegetarian_food = EXCLUDED.serves_vegetarian_food, 
		serves_wine = EXCLUDED.serves_wine, 
		takeout = EXCLUDED.takeout, 
		wheelchair_accessible_entrance = EXCLUDED.wheelchair_accessible_entrance,
		vicinity = EXCLUDED.vicinity,
		phone_number = EXCLUDED.phone_number,
		last_updated = NOW()
		RETURNING *
	`;
	const params = [
		place.place_id || null,
		place.name || null,
		place.formatted_address || null,
		place.geometry || null,
		place.opening_hours || null,
		place.rating || null,
		place.reviews || null,
		place.price_level || null,
		place.types || null,
		place.user_ratings_total || null,
		place.delivery || null,
		place.dine_in || null,
		place.reservable || null,
		place.serves_beer || null,
		place.serves_breakfast || null,
		place.serves_brunch || null,
		place.serves_dinner || null,
		place.serves_lunch || null,
		place.serves_vegetarian_food || null,
		place.serves_wine || null,
		place.takeout || null,
		place.wheelchair_accessible_entrance || null,
		place.formatted_phone_number || null,
		place.vicinity || null,
	];

	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Places");
	return result;
};

const createPlaceNew = async (place) => {
	const query = `
        INSERT INTO new_places ("${dataFields
			.map((field) => field)
			.join('", "')}", "updatedAt") 
        VALUES (${dataFields.map((f, i) => "$" + (i + 1))}, NOW()) 
        ON CONFLICT (id) DO UPDATE SET 
        ${dataFields
			.map((field, i) =>
				place[field] !== null
					? `"${field}" = EXCLUDED."${field}"`
					: null
			)
			.filter(Boolean)
			.join(", ")}, "updatedAt" = NOW()
        RETURNING *
    `;
	const params = dataFields.map((field) => place[field] || null);
	// console.log(query);
	const result = await base.query(query, params);
	return result;
};

const getPlace = async (id) => {
	const query = "SELECT * FROM places WHERE place_id = $1";
	const params = [id];
	const result = await base.query(query, params);
	return result;
};

const getPlaceByName = async (name) => {
	console.log(name);
	const query = "SELECT * FROM places WHERE name = $1";
	const params = [name];
	const result = await base.query(query, params);
	return result;
};

const getPlaces = async () => {
	const query = "SELECT * FROM places";
	const key = "rediskey" + "Places";
	const result = await base.query_redis(key, query);
	return result;
};

const updatePlace = async (id, place) => {
	const query =
		"UPDATE places SET name = $1, address = $2, lat = $3, lon = $4, type = $5 WHERE id = $6 RETURNING *";
	const params = [
		place.name,
		place.address,
		place.lat,
		place.lon,
		place.type,
		id,
	];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Places");
	return result;
};

const deletePlace = async (id) => {
	const query = "DELETE FROM places WHERE place_id = $1";
	const params = [id];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Places");
	return result;
};

module.exports = {
	createPlace,
	createPlaceNew,
	getPlace,
	getPlaces,
	updatePlace,
	deletePlace,
	getPlaceByName,
};
