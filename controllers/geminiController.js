const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyB3MhiTdLd7KFC08sR-EBNjWO1M8ZNeYj8");
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

const askGeminiLive = async (req, res) => {
	const { question, answer } = req.body.query;
	console.log("Hit Gemini", question, answer);
	let options = ""; // Assuming prompt is initialized earlier in your code
	for (let i = 0; i < answer.options.length; i++) {
		if (answer.options[i] === "") {
			break;
		}
		options += `Option${i + 1}: ${answer.options[i]}, `;
	}

	const message_text = [
		{
			role: "user",
			parts: [
				{
					text: `Context:\n${req.body.context}. From this context I will ask you MCQ Questions.`,
				},
			],
		},
		{
			role: "model",
			parts: [
				{
					text: `Okay. Got it. Ask any question.`,
				},
			],
		},
	];

	const chat = model.startChat({
		history: message_text,
		generationConfig: {
			maxOutputTokens: 4096,
		},
	});

	const msg = `Question:\n${question} Options:\n${options}. Choose the answer from the following options (1/2/3/4). And give explanation in bracket. So, the output format will be \"Option_Number (Explanation). If there is no answer in the options, then return 0 first and explain the reason. Remember you need to answer the question only from the context, not using any of your own knowledge. If the question can't be answered from the context notify it. Also return 0 if the correct answer is not present in the options.)`;

	try {
		const result = await chat.sendMessage(msg);
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
