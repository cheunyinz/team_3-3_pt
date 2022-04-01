const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const bodyParser = require("body-parser");
const sessions = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const getUserData = require("./database");

const dbName = "tech-3-3";

let session;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((err, req, res, next) => {
  res.status(404).send("404 not found");
});

app.use(
  sessions({
    secret: process.env.SESSION_KEY,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
    resave: false,
  })
);

app.get("/", (req, res) => {
  session = req.session;
  console.log(session);
  session.userid
    ? loggedInUser(res)
    : res.render("login", {
        pageTitle: `log-in`,
      });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    pageTitle: `sign-up`,
  });
});

app.get("/profile", (req, res) => {
  session = req.session;

  loggedInUser(res);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/error/:id", (req, res) => {
  req.params.id === "email"
    ? res.render("error", {
        data: "De gekozen e-mail adres is al in gebruik",
        pageTitle: `error`,
      })
    : res.render("error", {
        data: "Gebruiker niet gevonden",
        pageTitle: `error`,
      });
});

app.post("/", checkForUser);
app.post("/signup", createUser);


function createUser(req, res) {
  session = req.session;

  let newUserData = {
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    likes: req.body.interests,
    email: req.body.email,
  };

  getUserData(dbName).then(async (data) => {
    const emailCheck = await data.findOne({ email: req.body.email });

    if (emailCheck === null) {
      data.insertOne(newUserData);
      session.userid = req.body.username;
      res.redirect("/profile");
    } else {
      res.redirect("/error/" + "email");
    }
  });
}

function checkForUser(req, res) {
  session = req.session;

  getUserData(dbName)
    .then((data) =>
      data.findOne({
        username: req.body.username,
        password: req.body.password,
      })
    )
    .then((user) => {
      if (user) {
        session.userid = req.body.username;
        res.redirect("/profile");
      } else {
        res.redirect("/error/" + "user");
      }
    });
}

function loggedInUser(response) {
  getUserData(dbName)
    .then((user) =>
      user.findOne({
        username: session.userid,
      })
    )
    .then((foundUser) =>
      response.render("profile", {
        data: foundUser,
        pageTitle: `profile`,
      })
    );
}

app.listen(port, function () {
  console.log(`Live on localhost:${port}`);
});
