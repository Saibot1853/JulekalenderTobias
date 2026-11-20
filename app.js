const express = require("express");
const  mongoose  = require("mongoose");
require("dotenv").config();
const argon2 = require("argon2")

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))
// mongoose.connect("mongodb:http://localhost:4000")
mongoose.connect(process.env.MONGODB_URI);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/admin", (req, res) => {
  res.render("index");
});

app.post("/login", (req, res) => {
  res.render("login");
});



app.listen(4000, () => {
  console.log("Server running at http://localhost:4000");
});


// app.listen(process.env.PORT,) () => {
//     console.log(`listening on http://localhost:$(process.env.PORT)`)
// }

