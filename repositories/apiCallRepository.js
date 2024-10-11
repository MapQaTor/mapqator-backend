const base = require("./base");

const get = async (request) => {
	const query = `
        SELECT *
        FROM api_calls
        WHERE url = $1 AND method = $2 AND headers = $3 AND data = $4 AND params = $5
    `;
	const params = [
		request.url,
		request.method,
		request.headers,
		request.data,
		request.params,
	];
	// If found then update hit count
	const result = await base.query(query, params);

	if (result.data.length > 0) {
		const updateQuery = `
            UPDATE api_calls
            SET hit_count = hit_count + 1
            WHERE id = $1
        `;
		await base.query(updateQuery, [result.data[0].id]);
	}
	return result;
};

const set = async (request, response) => {
	const query = `
        INSERT INTO api_calls (url, method, headers, data, params, response)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
	const params = [
		request.url,
		request.method,
		request.headers,
		request.data,
		request.params,
		response,
	];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	get,
	set,
};
