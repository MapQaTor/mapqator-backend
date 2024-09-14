const base = require("./base");

const insertResult = async (result) => {
	for (const row of result) {
		const query = `
            INSERT INTO evaluations (query_id, model_id, answer, verdict, type, option)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (query_id, model_id, type) DO UPDATE SET
            answer = $3, verdict = $4 
            RETURNING *
        `;

		const params = [
			row.query_id,
			row.model_id,
			row.answer,
			row.verdict,
			row.type,
			row.option,
		];
		await base.query(query, params);
	}

	await base.delete_redis("rediskey" + "Queries");
	return { success: true };
};

const insertResultByQuery = async (query_id, model_id, answer, verdict) => {
	const query = `
		INSERT INTO evaluations (query_id, model_id, answer, verdict)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (query_id, model_id) DO UPDATE SET
		answer = $3, verdict = $4 
		RETURNING *
	`;
	const params = [query_id, model_id, answer, verdict];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const insertNewResultByQuery = async (query_id, model_id, responses) => {
	const query = `
		INSERT INTO new_evaluations (query_id, model_id, responses)
		VALUES ($1, $2, $3)
		ON CONFLICT (query_id, model_id) DO UPDATE SET
		responses = $3
		RETURNING *
	`;
	const params = [query_id, model_id, responses];
	const result = await base.query(query, params);
	return result;
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

const deleteEvaluationByQuery = async (query_id) => {
	console.log("Deleting evaluations for query_id: " + query_id);
	const query = `
		DELETE FROM evaluations
		WHERE query_id = $1 AND model_id != 0
	`;
	const params = [query_id];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const deleteNewEvaluationByQuery = async (query_id) => {
	console.log("Deleting evaluations for query_id: " + query_id);
	const query = `
		DELETE FROM new_evaluations
		WHERE query_id = $1 AND model_id != 0
	`;
	const params = [query_id];
	const result = await base.query(query, params);
	return result;
};

module.exports = {
	insertResult,
	getAllResults,
	getResultsByQuery,
	getResultsByModel,
	deleteEvaluationByQuery,
	deleteNewEvaluationByQuery,
	insertResultByQuery,
	insertNewResultByQuery,
};
