const placeRepository = require("../repositories/placeRepository");

const createPlace = async (req, res) => {
	const place = req.body;
	const result = await placeRepository.createPlace(place);
	if (result.success) {
		res.status(201).send(result.data);
	} else {
		res.status(400).send(result);
	}
};

const createPlaceNew = async (req, res) => {
	const place = req.body;
	const result = await placeRepository.createPlaceNew(place);
	if (result.success) {
		res.status(201).send(result.data);
	} else {
		res.status(400).send(result);
	}
};

const getPlace = async (req, res) => {
	const id = parseInt(req.params.id);
	const result = await placeRepository.getPlace(id);
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(404).send(result);
	}
};

const getPlaces = async (req, res) => {
	const result = await placeRepository.getPlaces();
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(404).send(result);
	}
};

const updatePlace = async (req, res) => {
	const id = parseInt(req.params.id);
	const place = req.body;
	const result = await placeRepository.updatePlace(id, place);
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(400).send(result);
	}
};

const deletePlace = async (req, res) => {
	const id = parseInt(req.params.id);
	const result = await placeRepository.deletePlace(id);
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(400).send(result);
	}
};

module.exports = {
	createPlace,
	createPlaceNew,
	getPlace,
	getPlaces,
	updatePlace,
	deletePlace,
};
