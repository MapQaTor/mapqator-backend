const evaluationRepository = require("../repositories/evaluationRepository");

const insertResult = async (req, res) => {
	try {
		let list = req.body.list;
		console.log(req.body);
		list = JSON.parse(list);
		const result = await evaluationRepository.insertResult(list);

		if (result.success) {
			res.status(200).json({
				message: "Result inserted successfully",
			});
		} else {
			res.status(400).json({ error: "Can't insert result" });
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ error: error.message });
	}
};

const getAllResults = async (req, res) => {
	try {
		const result = await evaluationRepository.getAllResults();
		if (result.success) {
			res.status(200).json(result.data);
		} else {
			res.status(404).json({ error: "No result found" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getResultsByQuery = async (req, res) => {
	try {
		const query_id = req.params.query_id;
		const result = await evaluationRepository.getResultsByQuery(query_id);
		if (result.success) {
			res.status(200).json(result.data);
		} else {
			res.status(404).json({ error: "No result found" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getResultsByModel = async (req, res) => {
	try {
		const model_id = req.params.model_id;
		const result = await evaluationRepository.getResultsByModel(model_id);
		if (result.success) {
			res.status(200).json(result.data);
		} else {
			res.status(404).json({ error: "No result found" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	insertResult,
	getAllResults,
	getResultsByQuery,
	getResultsByModel,
};
