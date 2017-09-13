var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

// The body-parser library will allow us to access POST
// request parameters, such as req.body.longURL
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// In order to simulate generating a "unique"
// shortURL, for now you will implement a function
// that produces a string of 6 random alphanumeric
// characters:
function generateRandomString() {
  let text = "";
  let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["username"]});
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log(urlDatabase[req.params.id]);
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});


//Update
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  let path = /urls/+req.params.id;
  res.redirect(path);
});

// Delete
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Add
app.post("/urls", (req, res) => {
  //console.log(req.body.longURL);  // debug statement to see POST parameters
  urlDatabase[generateRandomString()] = req.body.longURL;
  //res.send(urlDatabase);         // Respond with 'Ok' (we will replace this)
  res.redirect('/urls');
});

// Login
app.post("/login", (req, res) => {
  //console.log(req.body);
  res.cookie('username', req.body.username);
  res.redirect('/urls');
})

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
