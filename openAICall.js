const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

function getKey() {
  const key = fs.readFileSync('secretkey.txt', 'utf8').slice(0, 51);
  return key;
}

async function makeReq(key, feelings) {
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
      apiKey: getKey(),
    });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `you are a model that is trained on the lyrics of the top 100 songs. you are given some number of feelings or words and are requested to suggest 10 songs that best fit a combination of those words. Please only respond with the artist and the name of the songs no other text.User: I am feeling ${feelings}`,
      max_tokens: 1000,
      temperature: 0,
    });
  return response;
}

function produceReq(feelings) {
  return feelings.join(' and ');
}

async function main() {
  const feelings = produceReq(['drake']);
  const key = getKey();
  const resp = await makeReq(key, feelings);
  console.log(resp.data.choices[0].text);
}

main();
