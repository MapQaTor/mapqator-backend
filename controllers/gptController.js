const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const queryRepository = require("../repositories/queryRepository");

const client = new OpenAIClient(
	"https://qcri-llm-rag-5.openai.azure.com/",
	new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

const translateContext = async (req, res) => {
	const message_text = [
		{
			role: "system",
			content:
				"You are an AI assistant that helps people that translate any language to English.",
		},
		{
			role: "user",
			content:
				"I will give you some information mixed with different languages, you need to translate it to English. I want exact translation of the Non-English part to English.",
		},
		{
			role: "user",
			content: `Information of Narayanganj:
					- Location: Narayanganj, Bangladesh.
					Nearby places of Narayanganj of type "gym" are (sorted by distance in ascending order):
					1. HOT GYM - 4th floor, club limited, Shuresh plaza, 144 B.B road, front side of, নারায়ণগঞ্জ
					2. FitnessNation Narayanganj - JFVV+F2F, Firoz Tower, শিবু মার্কেট - ফতুল্লা রোড
					3. Life Style Fitness - Fatullah, Narayanganj
					4. Gym - Fatullah
					5. Dulal bhandari grace - JFWW+RFW
					6. AxXis Gym - JFQF+QCC, R810
					7. Super power GYM - ফতুল্লা, B6000
					8. FitnessTime - Shop-4, Montaj Uddin Plaza, Ponchoboti - Boktaboli Road
					9. Famous Gym - JGP3+7JH, চেয়ারম্যান বাড়ী রোড, Narayanganj
					10. MD Rajiv hossen - JGP3+3M5, চেয়ারম্যান বাড়ী রোড, Narayanganj
					11. Muscle King Gym - JFGR+FCX, Narayanganj Highway, Narayanganj
					12. Dream Touch Yoga Exercises For Slimming - Shop No. 82, Army Market, Chashara
					13. Ladies The World Gym - পাঠানটুলী বাস স্ট্যান্ড ২য় তলা
					14. Get Fit - bus stand
					15. Bangladesh self defense and sports karate academy(BSDSKA) - Govt - tularam, Holding:2/6, allama iqbal road, college road, নারায়ণগঞ্জ
					16. Parker fitness studio - 2a Allama Iqbal Road, Narayanganj
					17. Hasan Fitness Gym - MF7P+GHR, Jalkuri Bus Stand
					18. মামস - 41/2 Khanpur Main Road
					19. Power Fitness - JFFX+GXG, Dhaka
					20. GYM 71 - Narayanganj`,
		},
		{
			role: "assistant",
			content: `Information of Narayanganj:
					- Location: Narayanganj, Bangladesh.
					Nearby places of Narayanganj of type "gym" are (sorted by distance in ascending order):
					1. HOT GYM - 4th floor, club limited, Suresh plaza, 144 B.B road, front side of, Narayanganj
					2. FitnessNation Narayanganj - JFVV+F2F, Firoz Tower, Shibu Market - Fatulla Road
					3. Life Style Fitness - Fatulla, Narayanganj
					4. Gym - Fatulla
					5. Dulal Bhandari Grace - JFWW+RFW
					6. AxXis Gym - JFQF+QCC, R810
					7. Super Power Gym - Fatulla, B6000
					8. FitnessTime - Shop-4, Montaj Uddin Plaza, Ponchoboti - Boktaboli Road
					9. Famous Gym - JGP3+7JH, Chairman Bari Road, Narayanganj
					10. MD Rajiv Hossen - JGP3+3M5, Chairman Bari Road, Narayanganj
					11. Muscle King Gym - JFGR+FCX, Narayanganj Highway, Narayanganj
					12. Dream Touch Yoga Exercises For Slimming - Shop No. 82, Army Market, Chashara
					13. Ladies The World Gym - Pathantuli Bus Stand, 2nd Floor
					14. Get Fit - Bus Stand
					15. Bangladesh Self Defense and Sports Karate Academy (BSDSKA) - Govt - Tularam, Holding: 2/6, Allama Iqbal Road, College Road, Narayanganj
					16. Parker Fitness Studio - 2a Allama Iqbal Road, Narayanganj
					17. Hasan Fitness Gym - MF7P+GHR, Jalkuri Bus Stand
					18. Mums - 41/2 Khanpur Main Road
					19. Power Fitness - JFFX+GXG, Dhaka
					20. GYM 71 - Narayanganj`,
		},
		{
			role: "user",
			content: req.body.content,
		},
	];

	try {
		const { choices } = await client.getChatCompletions(
			// "GPT-35-TURBO-0125",
			"GPT-4o",
			message_text,
			{
				max_tokens: 4096,
				temperature: 0,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				// stop: ["\n"],
			}
		);
		console.log(choices[0].message["content"]);
		return res.send(choices[0].message["content"]);
	} catch (error) {
		console.error("An error occurred:", error);
		return res
			.status(500)
			.send({ success: false, error: "An error occurred" });
	}
};

const generateContext = async (req, res) => {
	// console.log(req.body);
	const message_text = [
		{
			role: "system",
			content:
				"You are an AI assistant that helps people that converts structured information to more natural information.",
		},
		{
			role: "user",
			content:
				"I will give you some structured information, you need to convert them to more humanly language. This is context for place related question. So, I want the context to be more humanly. Also, translate any Non-English part to English.",
		},
		{
			role: "user",
			content:
				"Information of Sultan's Dine: Location: Green Akshay Plaza, 1st Floor, 146/G (Old), 59, New সাতমসজিদ সড়ক, ঢাকা 1209, Bangladesh(23.7388632, 90.3753979). Information of My home: Location: Indira Rd, Dhaka 1215, Bangladesh(23.7580016, 90.38486789999999). Information of LABAID Specialized Hospital: Location: House - -1 and , 6, Road No. 4, Dhaka 1205, Bangladesh(23.7421428, 90.382994). Open: Monday: Open 24 hours, Tuesday: Open 24 hours, Wednesday: Open 24 hours, Thursday: Open 24 hours, Friday: Open 24 hours, Saturday: Open 24 hours, Sunday: Open 24 hours. Transit Distance from My home to Sultan's Dine is 2.6 km(37 mins). Driving Distance from My home to LABAID Specialized Hospital is 2.0 km(28 mins). Walking Distance from Sultan's Dine to LABAID Specialized Hospital is 1.6 km(22 mins). Transit Distance from LABAID Specialized Hospital to Sultan's Dine is 1.1 km(16 mins). Today is Monday. I am at My home.",
		},
		{
			role: "assistant",
			content:
				"Sultan's Dine is located on the first floor of Green Akshay Plaza, at 146/G (Old), 59, New Satmasjid Road, Dhaka 1209, Bangladesh. My home is on Indira Road in Dhaka, Bangladesh, with the postal code 1215. LABAID Specialized Hospital is situated at House -1 and 6, Road No. 4, Dhaka 1205, Bangladesh. Sultan's Dine operates 24 hours every day of the week. The transit distance from my home to Sultan's Dine is approximately 2.6 kilometers, which would take about 37 minutes by public transport. Driving from my home to LABAID Specialized Hospital covers about 2.0 kilometers and takes around 28 minutes. Walking from Sultan's Dine to LABAID Specialized Hospital is about 1.6 kilometers and takes around 22 minutes. Conversely, traveling from LABAID Specialized Hospital to Sultan's Dine has a transit distance of about 1.1 kilometers and takes around 16 minutes by public transport. Today is Monday and I am currently at my home.",
		},
		{
			role: "user",
			content: `Information of Bangladesh University of Engineering and Technology (BUET): Location: Polashi, Dhaka, Bangladesh(23.7265659, 90.3926596). 
      Nearby places of Bangladesh University of Engineering and Technology (BUET) of type "cafe" with keyword "metro" are (ranked by distance):
      1. Coffee Buzz | Lazz center, 63, Lake Circus, West পান্থপথ, ঢাকা 1205, Bangladesh
      2. Pinewood Cafe n' Restaurant | House no: 19, Rd No 12, Dhaka 1209, Bangladesh
      3. Gloria Jean's Coffees, Dhanmondi | 67, 1st Floor, Navana GH Heights, সাতমসজিদ সড়ক, ঢাকা 1205, Bangladesh
      4. Cafe Air - Bell Pepper | Bangladesh Air Meusum, Dhaka 1207, Bangladesh
      5. Cloud Coffee - Agargaon | 205/1/A, Begum Rokeya Sharani, Agargaon, Taltola Agargaon, ঢাকা 1207, Bangladesh
      6. Roseate Cafe | 1st floor, House 61 Rd No-15, Dhaka 1213, Bangladesh
      7. Pinewood Cafe + Kitchen | House 48 Road No 13C, Dhaka 1213, Bangladesh
      8. Tagore Terrace | House 44 Rd 12, Dhaka 1212, Bangladesh
      9. Cooper's Coffee Shop | 25, Metropolitan Shopping Plaza, ঢাকা 1212, Bangladesh
      10. Sub-Street Twist (সাব স্ট্রীট টুইস্ট) | Mirpur Rd, Dhaka 1206, Bangladesh
      11. Metro Baker's and Cafe | R937+Q4F, Dhaka 1216, Bangladesh
      12. Lal Math (লাল মাঠ) Tee Zone | R9G8+88J, Rd No. 4, Dhaka 1216, Bangladesh
      13. IZ pâtisserie and café | B.A, House #45 Rd No. 7, Dhaka 1216, Bangladesh
      14. AD Mart 5 Point Garden Cafe | R9M7+MCP, Dhaka, Bangladesh
      15. Fusion (AD Canteen) | R9R5+692, Dhaka, Bangladesh
      16. Neuve'mi Cafe & Restro | Diabari Dhaka Division,Bangladesh D, Plot #1/A, সড়ক-২, ঢাকা 1230, Bangladesh
      Nearby places of Bangladesh University of Engineering and Technology (BUET) of type "cafe"  are (in 1000 m radius):
      1. BUET Staff Canteen | P9GV+56Q, Dhaka, Bangladesh
      2. মুক্তি কর্নার | P9GR+MC8, Dhaka, Bangladesh
      3. Mannan Vai's Canteen | BUET White Campus, BUET Central Road, Dhaka, Bangladesh
      4. রাসেল ভাইয়ের দোকান | Ahsanullah Hall, Shahid Smirti Hall Connecting Road, Dhaka, Bangladesh
      5. Nasir Tea Stall | P9HR+32R, Zahir Raihan Rd, Dhaka 1205, Bangladesh
      6. Tea Stall (With Chicken Flavour) | BUET Market, 154 Zahir Raihan Rd, Dhaka, Bangladesh
      7. Jahir's Cantine | P9FV+GVJ, Bakshi Bazar Road, Dhaka, Bangladesh
      8. The Nineteenth Coffee | P9FW+Q7P, Bakshi Bazar Road, Dhaka, Bangladesh
      9. Kalapata Kichen | P9FW+Q68, Bakshi Bazar Road, Dhaka, Bangladesh
      10. সালাম ষ্টোর | Polashi Mor, Dhaka 1205, Bangladesh
      11. Takeaway Polashi | 22, 6/4 Dhakeshwari Rd, Polashi 1211, Bangladesh
      12. Mon Chai Ca | Victoriya Park , Shop no-02, City Corporation Market, ঢাকা 1100, Bangladesh
      13. Awake Coffee Roasters at British Council | 5 Fuller Road, Dhaka 1000, Bangladesh
      14. আর এস স্ন্যাকস্ কর্ণার | ঢাকা মেডিকেল হাসপাতাল,গেইট-২, ঢাকা, Bangladesh
      15. Ohi's Tong | P9CV+QW3, Dhaka, Bangladesh
      16. Mashallah Tea Store | 33 Khaja Dewan 1st Ln, Dhaka 1211, Bangladesh
      17. মালেক টি টি স্টোর | 33 Khaja Dewan 1st Ln, Dhaka 1211, Bangladesh
      18. Juan cafe | 49/a, azimpur estate, 1205, ঢাকা 1205, Bangladesh
      19. Mustafa mia Store | P9JQ+63J, Dhaka 1205, Bangladesh
      20. ফারুক মামার দোকান | TSC Tea Stall, Dhaka, Bangladesh`,
		},
		{
			role: "assistant",
			content: `Bangladesh University of Engineering and Technology (BUET) is located in Polashi, Dhaka, Bangladesh. Nearby cafes with the keyword "metro" include Coffee Buzz, Pinewood Cafe n' Restaurant, Gloria Jean's Coffees, Cafe Air - Bell Pepper, Cloud Coffee - Agargaon, Roseate Cafe, Pinewood Cafe + Kitchen, Tagore Terrace, Cooper's Coffee Shop, Sub-Street Twist, Metro Baker's and Cafe, Lal Math Tee Zone, IZ pâtisserie and café, AD Mart 5 Point Garden Cafe, Fusion (AD Canteen), and Neuve'mi Cafe & Restro.

Within a 1000-meter radius of BUET, there are also several cafes such as BUET Staff Canteen, Mukti Corner, Mannan Vai's Canteen, Russel Bhai's Shop, Nasir Tea Stall, Tea Stall (With Chicken Flavor), Jahir's Canteen, The Nineteenth Coffee, Kalapata Kitchen, Salam Store, Takeaway Polashi, Mon Chai Ca, Awake Coffee Roasters at British Council, RS Snacks Corner, Ohi's Tong, Mashallah Tea Store, Malek Tea Store, Juan Cafe, Mustafa Mia Store, and Faruk Mama's Shop.
`,
		},
		{
			role: "user",
			content: req.body.content,
		},
	];

	try {
		const { choices } = await client.getChatCompletions(
			"GPT-35-TURBO-0125",
			message_text,
			{
				max_tokens: 800,
				temperature: 0,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				// stop: ["\n"],
			}
		);
		console.log(choices[0].message["content"]);
		return res.send(choices[0].message["content"]);
	} catch (error) {
		console.error("An error occurred:", error);
		return res
			.status(500)
			.send({ success: false, error: "An error occurred" });
	}
};

tools = [
	{
		type: "function",
		function: {
			name: "getPlaceDetails",
			description: "Get the full details of a place",
			parameters: {
				type: "object",
				properties: {
					place: {
						type: "string",
						description:
							"The name of the place to get details for.",
					},
					address: {
						type: "string",
						description:
							"The address of the place to get details for.",
					},
				},
				required: ["place", "address"],
			},
		},
	},
];

const askGPTWithoutContext = async (req, res) => {
	const result = await queryRepository.getQuery(req.params.id);
	if (result.success) {
		const { question, context_gpt, answer } = result.data[0];

		// Convert answer.options to string

		let options = ""; // Assuming prompt is initialized earlier in your code

		for (let i = 0; i < answer.options.length; i++) {
			if (answer.options[i] === "") {
				break;
			}
			options += `Option${i + 1}: ${answer.options[i]}, `;
		}

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
				content: `Question:\n${question} Options:\n${options}`,
			},
		];

		console.log(`Question:\n${question} Options:\n${options}`);
		try {
			const { choices } = await client.getChatCompletions(
				"GPT-35-TURBO-0125",
				question,
				{
					max_tokens: 4096,
					temperature: 0,
					top_p: 1,
					frequency_penalty: 0,
					presence_penalty: 0,
					// stop: ["\n"],
					messages: message_text,
					tools: tools,
				}
			);
			// check if choices[0].message["content"] is a number
			// if not, return the message
			// if it is a number, check if it is within the range of the options
			// if not, return the message
			// if it is within the range of the options, return the message
			response_message = choices[0].message;
			message_text.push(response_message);
			console.log(response_message);
			toolCalls = response_message.toolCalls;

			if (toolCalls.length > 0) {
				toolCalls.forEach((toolCall) => {
					if (toolCall.name === "getPlaceDetails") {
						const place = toolCall.parameters.place;
						// call the function to get the place details
						// and append the response to the message_text
					}
				});
			}
			console.log(choices[0].message);
			res.send(choices[0].message);
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

// def extract(s): for char in s: if char.isdigit(): return char return None # Return None if no numeric character is found convert to javascript
const extract = (s) => {
	for (let char of s) {
		if (/\d/.test(char)) {
			return char;
		}
	}
	return null;
};

const askGPT = async (req, res) => {
	const result = await queryRepository.getQuery(req.params.id);
	if (result.success) {
		const { question, context_gpt, answer } = result.data[0];

		// Convert answer.options to string
		let options = ""; // Assuming prompt is initialized earlier in your code

		for (let i = 0; i < answer.options.length; i++) {
			if (answer.options[i] === "") {
				break;
			}
			options += `Option${i + 1}: ${answer.options[i]}, `;
		}

		const message_text = [
			{
				role: "system",
				content:
					"You are an AI assistant that answers Place related MCQ questions.",
			},
			{
				role: "user",
				content: `Context:\n${context_gpt} Question:\n${question} Options:\n${options}. Choose the answer from the following options (1/2/3/4). And give explanation in bracket. So, the output format will be \"Option_Number (Explanation). If there is no answer in the options, then return 0 first and explain the reason. Remember you need to answer the question only from the context, not using any of your own knowledge. If the question can't be answered from the context notify it. Also return 0 if the correct answer is not present in the options.)`,
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
					max_tokens: 4096,
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

const askGPTLive = async (req, res) => {
	const { question, answer } = req.body.query;
	console.log("Hit GPT", req.body.context, question, answer);
	let options = ""; // Assuming prompt is initialized earlier in your code

	for (let i = 0; i < answer.options.length; i++) {
		if (answer.options[i] === "") {
			break;
		}
		options += `Option${i + 1}: ${answer.options[i]}, `;
	}

	// https://platform.openai.com/docs/guides/prompt-engineering/strategy-provide-reference-text
	// system: Use the provided articles delimited by triple quotes to answer questions. If the answer cannot be found in the articles, write "I could not find an answer."

	// user: <insert articles, each delimited by triple quotes></insert>
	// Question: <insert question here>

	const message_text = [
		{
			role: "system",
			content:
				"You are an AI assistant that answers Place related MCQ questions.",
		},
		{
			role: "user",
			content: `Context:\n${req.body.context} Question:\n${question}  Options:\n${options}. Choose the answer from the following options (1/2/3/4). And give explanation in bracket. So, the output format will be \"Option_Number (Explanation). If there is no answer in the options, then return 0 first and explain the reason. Remember you need to answer the question only from the context, not using any of your own knowledge. If the question can't be answered from the context notify it. Also return 0 if the correct answer is not present in the options.)`,
		},
	];

	try {
		const { choices } = await client.getChatCompletions(
			"GPT-35-TURBO-0125",
			req.body.query,
			{
				max_tokens: 4096,
				temperature: 0,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				// stop: ["\n"],
				messages: message_text,
			}
		);
		console.log(choices[0].message["content"]);
		return res.send(choices[0].message["content"]);
	} catch (error) {
		console.error("An error occurred:", error);
		return res
			.status(500)
			.send({ success: false, error: "An error occurred" });
	}
};

const generateQuestion = async (req, res) => {
	const message_text = [
		{
			role: "system",
			content:
				"You are an AI assistant that helps people generate questions.",
		},
		{
			role: "user",
			content:
				"I will give you some information, you need to generate a question based on the information. The question should sound like user is asking a question. This is for QnA dataset.",
		},
		{
			role: "user",
			content:
				"Information of <b>Paris</b>:\n- Location: Paris, France.\n\nInformation of <b>Louvre Museum</b>:\n- Location: 75001 Paris, France.\n\nInformation of <b>Cathédrale Notre-Dame de Paris</b>:\n- Location: 6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France.\n\nInformation of <b>Eiffel Tower</b>:\n- Location: Av. Gustave Eiffel, 75007 Paris, France.\n\nTravel time from <b>Cathédrale Notre-Dame de Paris</b> to <b>Eiffel Tower</b> is:\n- By cycle: 20 mins (5.4 km).\n\nTravel time from <b>Louvre Museum</b> to <b>Cathédrale Notre-Dame de Paris</b> is:\n- By cycle: 12 mins (2.2 km).",
		},
		{
			role: "assistant",
			content:
				"I am planning a visit to Paris and want to maximize my time. If I spend 2 hours at the Louvre Museum in the morning, 1 hour at the Notre-Dame Cathedral around noon, and 1 hour at the Eiffel Tower in the afternoon, how much time should I allocate for travel between these places using public transport?",
		},
		{
			role: "user",
			content: "Good. Next Context is: " + req.body.context,
		},
	];

	try {
		const { choices } = await client.getChatCompletions(
			"GPT-35-TURBO-0125",
			req.body.context,
			{
				max_tokens: 4096,
				temperature: 0,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				// stop: ["\n"],
				messages: message_text,
			}
		);
		console.log(choices[0].message["content"]);
		return res.send(choices[0].message["content"]);
		// return res.send("Time to go from Louvre to Eiffel Tower by car?");
	} catch (error) {
		console.error("An error occurred:", error);
		return res
			.status(500)
			.send({ success: false, error: "An error occurred" });
	}
};

module.exports = {
	generateContext,
	translateContext,
	askGPT,
	askGPTLive,
	generateQuestion,
};
