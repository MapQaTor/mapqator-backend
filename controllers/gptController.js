const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const queryRepository = require("../repositories/queryRepository");

const client = new OpenAIClient(
	"https://qcri-llm-rag-5.openai.azure.com/",
	new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

const generateContext = async (req, res) => {
	console.log(req.body);
};

const askGPT = async (req, res) => {
	console.log("Hit");
	const result = await queryRepository.getQuery(req.params.id);
	if (result.success) {
		const { question, context_gpt, answer } = result.data[0];

		// Convert answer.options to string
		const options = answer.options
			.map((option, index) => "Option " + (index + 1) + ". " + option)
			.join("\n");
		const message_text = [
			{
				role: "system",
				content:
					"You are an AI assistant that helps people find information.",
			},
			{
				role: "user",
				content: `I will ask you MCQ questions. You just need to answer numerically (e.g., 1/2/...). No explanation needed.only a number for example if its option 3 just say 3`,
			},
			{
				role: "user",
				content: `Context:\n${context_gpt} Question:\n${question} Options:\n${options}`,
			},
		];

		console.log(
			`Context:\n${context_gpt} Question:\n${question} Options:\n${options}`
		);
		try {
			const { choices } = await client.getChatCompletions(
				"GPT-35-TURBO-0125",
				question,
				{
					max_tokens: 800,
					temperature: 0,
					top_p: 1,
					frequency_penalty: 0,
					presence_penalty: 0,
					// stop: ["\n"],
					messages: message_text,
				}
			);
			// check if choices[0].message["content"] is a number
			// if not, return the message
			// if it is a number, check if it is within the range of the options
			// if not, return the message
			// if it is within the range of the options, return the message

			console.log(choices[0].message["content"][0]);
			res.send(choices[0].message["content"][0]);
		} catch (error) {
			console.error("An error occurred:", error);
			res.status(500).send({
				success: false,
				error: "An error occurred",
			});
		}
	} else {
		res.status(404).send(result);
	}
};
module.exports = {
	generateContext,
	askGPT,
};
