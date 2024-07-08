const base = require("./base");

const insertResult = async (result) => {
	for (const row of result) {
		const query = `
            INSERT INTO evaluations (query_id, model_id, answer, verdict)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (query_id, model_id) DO UPDATE SET
            answer = $3, verdict = $4 
            RETURNING *
        `;
		const params = [row.query_id, row.model_id, row.answer, row.verdict];
		await base.query(query, params);
	}

	await base.delete_redis("rediskey" + "Queries");
	return { success: true };
};

const getAllResults = async () => {
	const query = `
		SELECT *
		FROM evaluations
		JOIN models ON evaluations.model_id = models.id
	`;
	const result = await base.query(query);
	return result;
};

const getResultsByQuery = async (query_id) => {
	const query = "SELECT * FROM evaluations WHERE query_id = $1";
	const params = [query_id];
	const result = await base.query(query, params);
	return result;
};

const getResultsByModel = async (model_id) => {
	const query = "SELECT * FROM evaluations WHERE model_id = $1";
	const params = [model_id];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	insertResult,
	getAllResults,
	getResultsByQuery,
	getResultsByModel,
};
