const base = require("./base");

const createQuery = async (record, username) => {
	const query =
		"INSERT INTO dataset (question, answer, context, context_json, classification, context_gpt, username) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
	const params = [
		record.question,
		record.answer,
		record.context,
		record.context_json,
		record.classification,
		record.context_gpt,
		username,
	];
	const result = await base.query(query, params);
	return result;
};

const updateQuery = async (id, record) => {
	// console.log("Record: ", record);
	const query = `
			UPDATE dataset
			SET question = $1, answer = $2, context = $3, context_json = $4, classification = $5, context_gpt = $6
			WHERE id = $7
			RETURNING *
		`;
	const params = [
		record.question,
		record.answer,
		record.context,
		record.context_json,
		record.classification,
		record.context_gpt,
		id,
	];
	const result = await base.query(query, params);
	return result;
};

const getQuery = async (id) => {
	const query = `
		SELECT DS.id, DS.question, DS.answer, DS.context, DS.context_json, DS.classification, DS.context_gpt, DS.username, COALESCE(json_agg(json_build_object('answer', E.answer, 'verdict', E.verdict, 'model', M.name)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation
		FROM dataset DS
		LEFT JOIN evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		WHERE DS.id = $1
		GROUP BY DS.id
	`;
	const params = [id];
	const result = await base.query(query, params);
	return result;
};

const getQueries = async () => {
	const query = `
		SELECT DS.id, DS.question, DS.answer, DS.context, DS.context_json, DS.classification, DS.context_gpt, DS.username, COALESCE(json_agg(json_build_object('answer', E.answer, 'verdict', E.verdict, 'model', M.name)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation
		FROM dataset DS
		LEFT JOIN evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		GROUP BY DS.id
		ORDER BY id DESC
	`;
	const result = await base.query(query);
	return result;
};

const deleteQuery = async (id) => {
	const query = "DELETE FROM dataset WHERE id = $1";
	const params = [id];
	const result = await base.query(query, params);
	return result;
};

const getDataset = async () => {
	const query = "SELECT * FROM dataset";
	const result = await base.query(query);
	return result;
};

module.exports = {
	createQuery,
	getQuery,
	getQueries,
	updateQuery,
	deleteQuery,
	getDataset,
};
