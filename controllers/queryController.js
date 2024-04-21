const queryRepository = require("../repositories/queryRepository");

const createQuery = async (req, res) => {
  const query = req.body;
  const result = await queryRepository.createQuery(query);
  if (result.success) {
    res.status(201).send(result.data);
  } else {
    res.status(400).send(result);
  }
};

const getQuery = async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await queryRepository.getQuery(id);
  if (result.success) {
    res.send(result.data);
  } else {
    res.status(404).send(result);
  }
};

const getQueries = async (req, res) => {
  const result = await queryRepository.getQueries();
  if (result.success) {
    res.send(result.data);
  } else {
    res.status(404).send(result);
  }
};

const updateQuery = async (req, res) => {
  const id = parseInt(req.params.id);
  const query = req.body;
  const result = await queryRepository.updateQuery(id, query);
  if (result.success) {
    res.send(result.data);
  } else {
    res.status(400).send(result);
  }
};

const deleteQuery = async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await queryRepository.deleteQuery(id);
  if (result.success) {
    res.send(result.data);
  } else {
    res.status(400).send(result);
  }
};

module.exports = {
  createQuery,
  getQuery,
  getQueries,
  updateQuery,
  deleteQuery,
};
