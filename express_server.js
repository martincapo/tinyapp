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
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "2838475": {
    id: "2838475",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
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
  // res.render("urls_new", {username: req.cookies["username"]});
  res.render("urls_new", { user: users[req.cookies['user_id']] });
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/urls", (req, res) => {
  //let user_id = req.cookies['user_id'];
  let templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log(urlDatabase[req.params.id]);
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
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
  urlDatabase[req.params.id] = req.body.longURL;
  let path = /urls/+req.params.id;
  res.redirect(path);
});

// Delete an URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Add New URL
app.post("/urls", (req, res) => {  //console.log(req.body.longURL);  // debug statement to see POST parameters
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect('/urls');
});

// User Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  for (let id in users) {
    console.log(users[id].email);
    console.log(email);
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
