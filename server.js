import express from "express";
import fetch from "node-fetch";
import mongoose from "mongoose";
import bodyparser from "body-parser"
import fs from "fs"
import Configuration from "openai"
import OpenAIApi from "openai";

const app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/openai');
}

const modeschema = new mongoose.Schema({
  mode: String,
  song1: String,
  song2: String,
  song3: String,
  time: String
});

const now = new Date();
const Mode = mongoose.model('mode', modeschema);
const Users = new Mode({ mode: 'happy', song1:'rich flex', time: now});
//await Users.save();

// const Doe = await Mode.find();
// console.log(Doe);
// await Mode.find({ name: /^John/ });



// PUG specifics
app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));


function getSpotifyKey() {
  const key = fs.readFileSync('spotifysecrets.txt', 'utf8');
  return key;
}


const redirect_uri = "http://localhost:3000/callback";
const client_id = "24ea5cb7ba2a4f38923194a5ddc36658";
const client_secret = getSpotifyKey(); // MUST HIDE
// DO NOT PUSH TO GITHUB WITH CLIENT_SECRET AVAILABLE

global.access_token;

//endpoints
app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-library-read",
    redirect_uri: redirect_uri,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  });

  const data = await response.json();
  console.log(data); //shows us access token

  global.access_token = data.access_token;

  res.redirect("/home");
});

app.get("/home", async (req, res) => {
  res.render("home");
});

app.get("/openai", async (req, res) => {
  const userInfo = await getData("/me");  
  //console.log(userInfo.display_name)
  res.render("openai", { user: userInfo});
});

app.post("/openai", async (req, res) => {
  // var myData = new Mode(req.body);
  // myData.save().then(()=>{
  //   res.send("This item has been saved to the database")
  // }).catch(()=>{
  //   res.status(400).send("item was not saved to the database")
  // })
  const feelings = req.body
  const AIreq = produceReq(feelings)

  const AIresp = makeReq(AIreq)

  try {
    const obj = JSON.parse(AIresp.choices[0].message.contentg);
    res.send(obj)
  } catch (e) {
    console.error('Invalid JSON string:', e.message);
  }

  //const Users = new Mode({ mode: req.body.input, song1:'rich flex', time: now});
  //await Users.save();
});

async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  const data = await response.json();
  return data;
}

app.get("/dashboard", async (req, res) => {
  const userInfo = await getData("/me");
  const tracks = await getData("/me/tracks?limit=10");
  const artist_id = tracks.items[0].track.artists[0].id; // get the ID of the first artist in the first track of the user's library
  const track_id = tracks.items[0].track.id; // get the ID of the first track in the user's library

  const params = new URLSearchParams({
    seed_artist: artist_id,
    seed_tracks: track_id,
  });

  const data = await getData("/recommendations?" + params);
  res.render("dashboard", { user: userInfo, tracks: data.tracks, home_link: '/home' });
});

app.get("/recommendations", async (req, res) => {
  const artist_id = req.query.artist;
  const track_id = req.query.track;

  const params = new URLSearchParams({
    seed_artist: artist_id, // CHANGE???
    seed_genres: "rock", 
    // min 1:19 he talks abt this 
    seed_tracks: track_id, // CHANGE???

    // ^^^should finf the other categories "rock" falls into
  });

  const data = await getData("/recommendations?" + params);
  res.render("recommendation", { tracks: data.tracks });

});

app.get("/logout", (req, res) => {
  global.access_token = null;
  res.redirect("/authorize");
});

app.get("/search", async (req, res) => {
  const query = req.query.q;
  const type = req.query.type;

  const data = await getData(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  res.json(data);
});

app.get("/artists/:id/top-tracks", async (req, res) => {
  const artistId = req.params.id;
  const market = req.query.market;

  const data = await getData(`/artists/${artistId}/top-tracks?market=${market}`);
  res.json(data);
});

let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});



function getKey() {
  const key = fs.readFileSync('secretkey.txt', 'utf8').slice(0, 51);
  return key;
}

async function makeReq( feelings) {
    
    const configuration = new Configuration({
      apiKey: getKey(),
    });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `you are a model that is trained on the lyrics of the top 100 songs. you are given some number of feelings or words and are requested to suggest 10 songs that best fit a combination of those words. 
      Please only respond with the artist and the name of the songs in a json format. no other text.User: I am feeling ${feelings}`,
      max_tokens: 1000,
      temperature: 0,
    });
  return response;
}

function produceReq(feelings) {
  return feelings.concat(' and ');
}
