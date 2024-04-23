const base = require("./base");

const createQuery = async (record) => {
  const query =
    "INSERT INTO dataset (question, answer, context, context_json, classification, context_gpt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
  const params = [
    record.question,
    record.answer,
    record.context,
    record.contextJSON,
    record.class,
    record.contextGPT,
  ];
  const result = await base.query(query, params);
  return result;
};

const getQuery = async (id) => {
  const query = "SELECT * FROM dataset WHERE id = $1";
  const params = [id];
  const result = await base.query(query, params);
  return result;
};

const getQueries = async () => {
  const query = "SELECT * FROM dataset";
  const result = await base.query(query);
  return result;
};

const updateQuery = async (id, record) => {
  const query =
    "UPDATE dataset SET question = $1, answer = $2, context = $3 WHERE id = $4 RETURNING *";
  const params = [record.question, record.answer, record.context, id];
  const result = await base.query(query, params);
  return result;
};

const deleteQuery = async (id) => {
  const query = "DELETE FROM dataset WHERE id = $1";
  const params = [id];
  const result = await base.query(query, params);
  return result;
};

module.exports = {
  createQuery,
  getQuery,
  getQueries,
  updateQuery,
  deleteQuery,
};
