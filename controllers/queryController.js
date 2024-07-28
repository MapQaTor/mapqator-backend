const queryRepository = require("../repositories/queryRepository");
const evaluationRepository = require("../repositories/evaluationRepository");
const base = require("../repositories/base");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const client = new OpenAIClient(
	"https://qcri-llm-rag-5.openai.azure.com/",
	new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

const createQuery = async (req, res) => {
	const query = req.body;
	const { username } = req.user;
	const result = await queryRepository.createQuery(query, username);
	if (result.success) {
		res.status(201).send(
			(await queryRepository.getQuery(result.data[0].id)).data
		);
	} else {
		res.status(400).send(result);
	}
};

const createQueryWithEvaluation = async (req, res) => {
	const query = req.body;
	const { username } = req.user;
	await base.startTransaction();
	const result = await queryRepository.createQuery(query, username);
	if (!result.success) {
		await base.rollbackTransaction();
		return res.status(400).send({ error: "Failed to create query" });
	}

	for (let i = 0; i < query.evaluation.length; i++) {
		const evaluation = query.evaluation[i];
		const evaluationResult = await evaluationRepository.insertResultByQuery(
			result.data[0].id,
			evaluation.model_id,
			evaluation.answer,
			evaluation.verdict
		);
		if (!evaluationResult.success) {
			await base.rollbackTransaction();
			return res
				.status(400)
				.send({ error: "Failed to create query with evaluation" });
		}
	}
	await base.endTransaction();
	if (result.success) {
		res.status(201).send(
			(await queryRepository.getQuery(result.data[0].id)).data
		);
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

const updateCategory = async (req, res) => {
	const id = parseInt(req.params.id);
	const category = req.body.category;
	const result = await queryRepository.updateCategory(id, category);
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(400).send(result);
	}
};

const updateQuery = async (req, res) => {
	const id = parseInt(req.params.id);
	const query = req.body;
	const result = await queryRepository.updateQuery(id, query);
	if (result.success) {
		res.send((await queryRepository.getQuery(id)).data);
	} else {
		res.status(400).send(result);
	}
};

const updateQueryWithEvaluation = async (req, res) => {
	const id = parseInt(req.params.id);
	const query = req.body;
	await base.startTransaction();
	const result = await queryRepository.updateQuery(id, query);
	for (let i = 0; i < query.evaluation.length; i++) {
		const evaluation = query.evaluation[i];
		const evaluationResult = await evaluationRepository.insertResultByQuery(
			id,
			evaluation.model_id,
			evaluation.answer,
			evaluation.verdict
		);
		if (!evaluationResult.success) {
			await base.rollbackTransaction();
			return res
				.status(400)
				.send({ error: "Failed to update query with evaluation" });
		}
	}
	await base.endTransaction();
	if (result.success) {
		res.send((await queryRepository.getQuery(id)).data);
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

const getGPTContext = async (req, res) => {
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

const getDataset = async (req, res) => {
	const result = await queryRepository.getDataset();
	if (result.success) {
		res.send(result.data);
	} else {
		res.status(404).send(result);
	}
};

const annotate = async (req, res) => {
	const human = req.body;
	const { username } = req.user;
	const { id } = req.params;
	// console.log(req.params);
	const result = await queryRepository.annotate(id, human, username);
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
	updateCategory,
	updateQuery,
	deleteQuery,
	getGPTContext,
	getDataset,
	annotate,
	createQueryWithEvaluation,
	updateQueryWithEvaluation,
};
