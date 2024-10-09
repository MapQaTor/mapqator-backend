const base = require("./base");

const get = async (request) => {
	const query = `
        SELECT *
        FROM api_calls
        WHERE request = $1
    `;
	const params = [request];
	// If found then update hit count
	const result = await base.query(query, params);

	if (result.data.length > 0) {
		const updateQuery = `
            UPDATE api_calls
            SET hit_count = hit_count + 1
            WHERE request = $1
        `;
		await base.query(updateQuery, params);
	}
	return result;
};

const set = async (request, response) => {
	const query = `
        INSERT INTO api_calls (request, response)
        VALUES ($1, $2)
        RETURNING *
    `;
	const params = [request, response];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	get,
	set,
};
