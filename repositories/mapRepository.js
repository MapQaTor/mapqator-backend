const base = require("./base");

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

const getDirections = async (origin, destination, mode) => {
	const query = `SELECT * FROM get_directions($1, $2, $3)`;
	const params = [origin, destination, mode];
	const result = await base.query(query, params);
	return result;
};

const searchNearby = async (location, radius, type) => {
	const query = `SELECT * FROM search_nearby($1, $2, $3)`;
	const params = [location, radius, type];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	getDistance,
	getDirections,
	searchNearby,
	addDistance,
};
