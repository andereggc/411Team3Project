import express from "express";
import fetch from "node-fetch";

const app = express();


app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const redirect_uri = "http://localhost:3000/callback";
const client_id = "3dc064555d434042bd52092d02bae688";
const client_secret = "0706726529df44fe807d56beb34ba5ed"; // MUST HIDE
// DO NOT PUSH TO GITHUB WITH CLIENT_SECRET AVAILABLE


global.access_token;


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
  res.render("openai", { user: userInfo});
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


// <br>
// button.btn.btn-primary.circular_button.float-right.logout-button(onclick="localStorage.clear(); window.location.href='https://accounts.spotify.com/en/logout?continue=https:%2F%2Faccounts.spotify.com%2Fen%2Flogin%3Fcontinue%3Dhttps%253A%252F%252Faccounts.spotify.com%252Fauthorize%253Fscope%253Duser-library-read%2526response_type%253Dcode%2526redirect_uri%253Dhttp%253A%252F%252Flocalhost%253A3000%252Fcallback%2526client_id%253D24ea5cb7ba2a4f38923194a5ddc36658'") 
//   span.logout-text Logout
// <br>