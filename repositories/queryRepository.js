const base = require("./base");
const evaluationRepository = require("./evaluationRepository");
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
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const createNewQuery = async (record, username) => {
	const query =
		"INSERT INTO new_dataset (name, context, context_json, context_gpt, questions , username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
	const params = [
		record.name,
		record.context,
		record.context_json,
		record.context_gpt,
		record.questions,
		username,
	];
	const result = await base.query(query, params);
	return result;
};

const updateCategory = async (id, category) => {
	const query = `
		UPDATE dataset
		SET classification = $1
		WHERE id = $2
		RETURNING *
	`;
	const params = [category, id];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const updateQuery = async (id, record) => {
	// await evaluationRepository.deleteEvaluationByQuery(id);
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
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const updateNewQuery = async (id, record) => {
	// await evaluationRepository.deleteNewEvaluationByQuery(id);
	const query = `
		UPDATE new_dataset
		SET name = $1, context = $2, context_json = $3, context_gpt = $4, questions = $5
		WHERE id = $6
		RETURNING *
	`;
	const params = [
		record.name,
		record.context,
		record.context_json,
		record.context_gpt,
		record.questions,
		id,
	];
	const result = await base.query(query, params);
	return result;
};

const submitForEvaluation = async (id, context) => {
	await evaluationRepository.deleteNewEvaluationByQuery(id);
	const query = `
		UPDATE new_dataset
		SET context = $2
		WHERE id = $1
		RETURNING *
	`;
	const params = [id, context];
	const result = await base.query(query, params);
	return result;
};

const getQuery = async (id) => {
	const query = `
		SELECT DS.id, DS.question, DS.answer, DS.context, DS.context_json, DS.classification, DS.context_gpt, DS.username, COALESCE(json_agg(json_build_object('answer', E.answer, 'verdict', E.verdict, 'model', M.name)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation, json_build_object('answer', H.answer, 'explanation', H.explanation, 'username', H.username) as human
		FROM dataset DS
		LEFT JOIN human H
		ON DS.id = H.query_id
		LEFT JOIN evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		WHERE DS.id = $1
		GROUP BY DS.id, H.answer, H.explanation, H.username
	`;
	const params = [id];
	const result = await base.query(query, params);
	return result;
};

const getNewQuery = async (id) => {
	const query = `
		SELECT DS.*, COALESCE(json_agg(json_build_object('responses', E.responses, 'model', M.name)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation
		FROM new_dataset DS
		LEFT JOIN new_evaluations E
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

const getNewQueries = async () => {
	const query = `
		SELECT DS.*, COALESCE(json_agg(json_build_object('responses', E.responses, 'model', M.name)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation
		FROM new_dataset DS
		LEFT JOIN new_evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		GROUP BY DS.id
		ORDER BY id DESC
	`;
	const result = await base.query(query);
	return result;
};

const getQueries = async () => {
	const query = `
		SELECT DS.id, DS.question, DS.answer, DS.context, DS.context_json, DS.classification, DS.context_gpt, DS.username, COALESCE(json_agg(json_build_object('answer', E.answer, 'verdict', E.verdict, 'model', M.name, 'model_id', M.id, 'type', E.type, 'option', E.option, 'variant', M.variant)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation, json_build_object('answer', H.answer, 'explanation', H.explanation, 'username', H.username) as human
		FROM dataset DS
		LEFT JOIN human H
		ON DS.id = H.query_id
		LEFT JOIN evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		WHERE deleted = false and M.hidden = false
		GROUP BY DS.id, H.answer, H.explanation, H.username
		ORDER BY id DESC
	`;
	const key = "rediskey" + "Queries";
	const result = await base.query_redis(key, query);
	return result;
};

const deleteQuery = async (id) => {
	// const query = "DELETE FROM dataset WHERE id = $1";
	const query = `
		UPDATE dataset
		SET deleted = true
		WHERE id = $1
	`;
	const params = [id];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

const deleteNewQuery = async (id) => {
	const query = "DELETE FROM new_dataset WHERE id = $1";
	const params = [id];
	const result = await base.query(query, params);
	return result;
};

const getDataset = async () => {
	const query = `
		SELECT DS.id, DS.question, DS.answer, DS.context, DS.context_json, DS.classification, DS.context_gpt, DS.username, COALESCE(json_agg(json_build_object('answer', E.answer, 'verdict', E.verdict, 'model', M.name, 'model_id', M.id, 'type', E.type, 'option', E.option)) FILTER (WHERE M.name IS NOT NULL), '[]') as evaluation, json_build_object('answer', H.answer, 'explanation', H.explanation, 'username', H.username) as human
		FROM dataset DS
		LEFT JOIN human H
		ON DS.id = H.query_id
		LEFT JOIN evaluations E
		ON DS.id = E.query_id
		LEFT JOIN models M
		ON E.model_id = M.id
		WHERE deleted = false
		GROUP BY DS.id, H.answer, H.explanation, H.username
		ORDER BY id DESC
	`;
	const result = await base.query(query);
	return result;
};

const getModels = async () => {
	const query = `
		SELECT *
		FROM models
		where hidden = false
	`;
	const params = [];
	const result = await base.query(query, params);
	return result;
};

const getNewDataset = async () => {
	const query = `
        SELECT *
        FROM new_dataset
        WHERE id NOT IN (SELECT query_id FROM new_evaluations)
    `;
	const result = await base.query(query);
	return result;
};

const annotate = async (query_id, human, username) => {
	const query = `
		INSERT INTO human (query_id, answer, explanation, username)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (query_id) 
        DO UPDATE SET
            answer = EXCLUDED.answer,
            explanation = EXCLUDED.explanation,
			username = EXCLUDED.username
        RETURNING *
	`;
	const params = [query_id, human.answer, human.explanation, username];
	const result = await base.query(query, params);
	await base.delete_redis("rediskey" + "Queries");
	return result;
};

module.exports = {
	getModels,
	createQuery,
	getQuery,
	getQueries,
	updateCategory,
	updateQuery,
	deleteQuery,
	getDataset,
	annotate,
	createNewQuery,
	getNewQueries,
	getNewQuery,
	updateNewQuery,
	deleteNewQuery,
	submitForEvaluation,
	getNewDataset,
};
