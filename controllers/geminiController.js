const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

const askGeminiLive = async (req, res) => {
	// return res.send("Option 1");
	const { prompt } = req.bopdy;

	const message_text = [];

	const chat = model.startChat({
		history: message_text,
		generationConfig: {
			maxOutputTokens: 80,
		},
	});

	try {
		const result = await chat.sendMessage(
			prompt + "\n Keep your response concise and to the point."
		);
		const response = result.response;
		const text = response.text();
		console.log("Gemini response:", text);
		res.send(text);
	} catch (error) {
		console.error("An error occurred:", error);
		res.status(500).send({
			success: false,
			error: "An error occurred",
		});
	}
};

module.exports = {
	askGeminiLive,
};
