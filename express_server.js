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


//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// var urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

var urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    url: "http://www.lighthouselabs.ca",
    user_id: "2838475"
  },
  "9sm5xK": {
    id: "9sm5xK",
    url: "http://www.google.com",
    user_id: "8857324"
  }
};

const users = {
  "2838475": {
    id: "2838475",
    email: "user@example.com",
    password: "1234"
  },
 "8857324": {
    id: "8857324",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies['user_id']] === undefined) {
    res.redirect("/login");
  }
  res.render("urls_new", { user: users[req.cookies['user_id']] });
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

// Returns the subset of the URL database
// that belongs to the user with ID id, so that
// my endpoint code remains clean.
function urlsForUser(id) {
  let urlDatabaseForUser = {};
  for (let i in urlDatabase) {
    if (urlDatabase[i].user_id == id) {
      urlDatabaseForUser[i] = urlDatabase[i];
    }
  }
  return urlDatabaseForUser;
}

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.cookies['user_id']), user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = { url: urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

app.get("/login", (req, res) => {
  console.log(users);
  let templateVars = {user: users[req.cookies['user_id']], users: users};
  res.render("login", templateVars);
})

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  res.render("register", templateVars);
});


//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//Update an URL
app.post("/urls/:id/update", (req, res) => {
  if(urlDatabase[req.params.id].user_id === req.cookies['user_id']) {
    urlDatabase[req.params.id].url = req.body.longURL;
  }
  res.redirect("/urls/" + req.params.id);
});

// Delete an URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Add New URL
app.post("/urls", (req, res) => {  //console.log(req.body.longURL);  // debug statement to see POST parameters
  let shortURL = generateRandomString();
  let newURLInfo = {"id": shortURL, "url": req.body.longURL, "user_id": req.cookies['user_id'] }
  urlDatabase[shortURL] = newURLInfo;
  res.redirect('/urls');
});

// User Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  for (let id in users) {
    if(users[id].email === email) {
      if(users[id].password === password) {
        res.cookie('user_id', users[id].id);
        res.redirect('/');
      } else {
        res.status(403).send('password does not match please try again.');
        return;
      }
    }
  }
  res.status(403).send('e-mail cannot be found, please try with another e-mail.');
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


function isExistingEmail (data, email) {
  for (let i in data) {
    if(data[i].email === email) {
      return true;
    }
  }
  return false;
}

// Register
app.post("/register", (req, res) => {
  if(req.body.email === '' || req.body.password === '') {
    res.status(400).send('e-mail or password are empty');
    return;

  } else if (isExistingEmail(users, req.body.email)){
    res.status(400).send("e-mail is already existing in user's database.");
    return;

  //Create New user
  } else {
    let newUserID = generateRandomString();
    let registerInfo = {"id": newUserID, "email": req.body.email, "password": req.body.password}
    users[newUserID] = registerInfo;
    //res.cookie('user_id', newUserID);
    res.redirect('/login');
  }
})

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
