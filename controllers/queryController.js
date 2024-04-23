const queryRepository = require("../repositories/queryRepository");

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const client = new OpenAIClient(
  "https://qcri-llm-rag-5.openai.azure.com/",
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

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

const getGPTContext = async (req, res) => {
  console.log(req.body);
  const message_text = [
    {
      role: "system",
      content: "You are an AI assistant that helps people find information.",
    },
    {
      role: "user",
      content:
        "I will give you some structured information, you need to convert them to more humanly language.",
    },
    {
      role: "user",
      content:
        "Information of Sultan's Dine: Location: Green Akshay Plaza, 1st Floor, 146/G (Old), 59, New সাতমসজিদ সড়ক, ঢাকা 1209, Bangladesh(23.7388632, 90.3753979). Information of My home: Location: Indira Rd, Dhaka 1215, Bangladesh(23.7580016, 90.38486789999999). Information of LABAID Specialized Hospital: Location: House - -1 and , 6, Road No. 4, Dhaka 1205, Bangladesh(23.7421428, 90.382994). Open: Monday: Open 24 hours, Tuesday: Open 24 hours, Wednesday: Open 24 hours, Thursday: Open 24 hours, Friday: Open 24 hours, Saturday: Open 24 hours, Sunday: Open 24 hours. Distance from My home to Sultan's Dine is 2.6 km(37 mins). Distance from My home to LABAID Specialized Hospital is 2.0 km(28 mins). Distance from Sultan's Dine to LABAID Specialized Hospital is 1.6 km(22 mins). Distance from LABAID Specialized Hospital to Sultan's Dine is 1.1 km(16 mins)",
    },
    {
      role: "assistant",
      content:
        "Sultan's Dine is located at Green Akshay Plaza, 1st Floor, 146/G (Old), 59, New সাতমসজিদ সড়ক, Dhaka 1209, Bangladesh, and operates 24 hours every day. It is approximately 2.6 kilometers away from my home on Indira Road, Dhaka 1215, Bangladesh, which would take about 37 minutes to walk. LABAID Specialized Hospital, situated at House-1 and 6, Road No. 4, Dhaka 1205, Bangladesh, also operates 24/7. It is about 2.0 kilometers from my home, taking roughly 28 minutes to walk, and approximately 1.6 kilometers from Sultan's Dine, which is a 22-minute walk. Conversely, LABAID Specialized Hospital is approximately 1.1 kilometers away from Sultan's Dine, a 16-minute walk.",
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
        stop: ["\n"],
      }
    );
    console.log(choices[0].message["content"]);
    res.send(choices[0].message["content"]);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send({ success: false, error: "An error occurred" });
  }
};

module.exports = {
  createQuery,
  getQuery,
  getQueries,
  updateQuery,
  deleteQuery,
  getGPTContext,
};
