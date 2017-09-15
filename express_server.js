const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
// The body-parser library will allow us to access POST
// request parameters, such as req.body.longURL
const bodyParser = require("body-parser");

const morgan = require('morgan');

var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");

// logging middleware so we can see what's going on
// with our server. More info: https://github.com/expressjs/morgan
app.use(morgan('dev'))

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

// Returns the subset of the URL database
function urlsForUser(id) {
  let urlDatabaseForUser = {};
  for (let i in urlDatabase) {
    if (urlDatabase[i].user_id == id) {
      urlDatabaseForUser[i] = urlDatabase[i];
    }
  }
  return urlDatabaseForUser;
}

// check if user's email exist
function isExistingEmail (data, email) {
  for (let i in data) {
    if(data[i].email === email) {
      return true;
    }
  }
  return false;
}
// generate date in yyyy-mm-dd format
function getToday() {
  var d = new Date();
  let day = d.getDate();
  let month = d.getMonth()+1;

  if(day < 10) {
    day = '0' + day;
  }
  if(month < 10) {
    month = '0'+ month;
  }
  return d.getFullYear() +'-'+ month +'-'+ day;
}


//::::::::::::::::::::::::::::::::::
//              DATA
//::::::::::::::::::::::::::::::::::

var urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    url: "http://www.lighthouselabs.ca",
    user_id: "2838475",
    date: "2017-09-14",
    visits: "0",
    uVisits: "0"
  },
  "9sm5xK": {
    id: "9sm5xK",
    url: "http://www.google.com",
    user_id: "8857324",
    date: "2017-09-14",
    visits: "0",
    uVisits: "0"
  }
};

const users = {
  "2838475": {
    id: "2838475",
    email: "user@example.com",
    password: "$2a$10$WzfXL0pwN0cOUYBZ0.17ausxZxEHSfBpxL8PgLbQ2wUou6bhZD0HG"
  },
 "8857324": {
    id: "8857324",
    email: "user2@example.com",
    password: "$2a$10$WzfXL0pwN0cOUYBZ0.17ausxZxEHSfBpxL8PgLbQ2wUou6bhZD0HG"
  }
}

//::::::::::::::::::::::::::::::::::::
//            app.get
//::::::::::::::::::::::::::::::::::::
app.get("/", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Adding url page
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  }
  res.render("urls_new", { user: users[req.session.user_id] });
});

// short URLs shared with anyone
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Error please check your link.');
  } else {
    let visit = parseInt(urlDatabase[req.params.shortURL].visits);
    visit += 1;
    urlDatabase[req.params.shortURL].visits = visit;
    if(req.session[req.params.shortURL] === undefined) {
      let uVisit = parseInt(urlDatabase[req.params.shortURL].uVisits);
      uVisit += 1;
      urlDatabase[req.params.shortURL].uVisits = uVisit;
      req.session[req.params.shortURL] = generateRandomString();
    }

    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  }
});

// Show List of urls for loged in user
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

// Show URL for particular id (=short url)
app.get("/urls/:id", (req, res) => {
  let templateVars = { user: users[req.session.user_id], errors: null, url: null };
  if (urlDatabase[req.params.id] === undefined) {
    templateVars.errors = "Cannot find URL.";
  } else if (users[req.session.user_id].id !== urlDatabase[req.params.id].user_id) {
    templateVars.errors = "Unauthorized.";
  } else {
    templateVars.url = urlDatabase[req.params.id];
  }
  res.render("urls_show", templateVars);
});

// User login page
app.get("/login", (req, res) => {
  let templateVars = {user: users[req.session.user_id], users: users};
  res.render("login", templateVars);
})

// User registration page
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});


//::::::::::::::::::::::::::::::::::::::::
//            app.post
//:::::::::::::::::::::::::::::::::::::::::

// Update an URL
app.post("/urls/:id/update", (req, res) => {
  if(urlDatabase[req.params.id].user_id === req.session.user_id) {
    urlDatabase[req.params.id].url = req.body.longURL;
  }
  res.redirect("/urls");
});

// Delete an URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//Add New URL
app.post("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.status(400).send('Please login or register first.');
  } else {
    let shortURL = generateRandomString();
    let newURLInfo = {"id": shortURL, "url": req.body.longURL, "user_id": req.session.user_id, "date": getToday(), "visits": "0", "uVisits": "0" }
    urlDatabase[shortURL] = newURLInfo;
    res.redirect('/urls/' + shortURL);
  }
});

// User Login
app.post("/login", (req, res) => {
  console.log('sending post');
  const email = req.body.email;
  const password = req.body.password;
  var foundEmail = false;

  // Find user by email
  for (let id in users) {
    // If the email is registered
    if(users[id].email === email) {
      foundEmail = true;
      //check the password
      bcrypt.compare(password, users[id].password, (err, matched) => {
        if (matched) {
          // set a cookie to keep track of the user
          req.session.user_id = users[id].id;
          res.redirect('/')
        }
        else {
          res.status(403).send('password does not match please try again.');
        }
      });
    }
  }
  // If the email is NOT registered
  if(!foundEmail) {
    res.status(403).send('e-mail cannot be found, please try with another e-mail.');
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


// Register User
app.post("/register", (req, res) => {
  if(req.body.email === '' || req.body.password === '') {
    res.status(400).send('e-mail or password are empty');
    return;

  } else if (isExistingEmail(users, req.body.email)){
    res.status(400).send("e-mail is already existing in user's database.");
    return;

  //Create New user
  } else {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        res.send('There was an error creating your account.')
        return
      }
      // add user to database
      let newUserID = generateRandomString();
      let registerInfo = {"id": newUserID, "email": req.body.email, "password": hash}
      users[newUserID] = registerInfo;
      res.redirect('/login');
    })
  }
})

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
