const express = require("express");
const  mongoose  = require("mongoose");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { randomUUID } = require("crypto");

const app = express();
const sessions = new Map();
const ADMIN_EMAIL = "admin@afk.no";

app.use(express.static("public"));

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());

function getUser(req) {
  return sessions.get(req.cookies.sessionId);
}

function requireAdmin(req, res, next) {
  const user = getUser(req);
  if (!user || user.role !== "admin") return res.redirect("/login");
  next();
}

function getOpenDoor() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Oslo",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());
  const month = Number(parts.find(part => part.type === "month").value);
  const day = Number(parts.find(part => part.type === "day").value);

  if (month < 12) return 0;
  if (month > 12) return 24;
  return Math.min(day, 24);
}
// mongoose.connect("mongodb:http://localhost:4000")


app.get("/", async (req, res) => {
  const quiz = await mongoose.connection.db
    .collection("quizzes")
    .findOne({ _id: "christmas-quiz" });

  const openDoor = getOpenDoor();
  const questions = quiz ? quiz.questions.filter(question => question.id <= openDoor) : [];

  res.render("index", {
    questions,
    submitted: req.query.submitted === "1",
    participant: getUser(req) || null
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/registrer", (req, res) => {
  res.render("registrer");
});

app.get("/admin", requireAdmin, async (req, res) => {
  const quiz = await mongoose.connection.db
    .collection("quizzes")
    .findOne({ _id: "christmas-quiz" });

  const answers = await mongoose.connection.db
    .collection("answers")
    .find()
    .sort({ submittedAt: -1 })
    .toArray();

  res.render("admin", {
    questions: quiz ? quiz.questions : [],
    answers,
    noCorrectAnswers: req.query.noCorrectAnswers === "1"
  });
});

app.post("/answers", async (req, res) => {
  const participant = getUser(req);
  if (!participant) return res.redirect("/login");

  const questionId = Number(req.body.questionId);
  if (questionId > getOpenDoor()) {
    return res.status(403).send("Denne luka er ikke apen enna.");
  }

  const quiz = await mongoose.connection.db
    .collection("quizzes")
    .findOne({ _id: "christmas-quiz" });

  if (!quiz) {
    return res.status(404).send("Fant ikke julekalenderen.");
  }

  const question = quiz.questions.find(sporsmal => sporsmal.id === questionId);
  const answer = String(req.body.answer || "").trim();

  if (!question || !answer) {
    return res.status(400).send("Velg eller skriv et svar.");
  }

  await mongoose.connection.db.collection("answers").insertOne({
    questionId: question.id,
    question: question.question,
    participantName: participant.name,
    participantEmail: participant.email,
    answer,
    status: "pending",
    winner: false,
    submittedAt: new Date()
  });

  res.redirect("/?submitted=1");
});

app.post("/login", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!name || !email) {
    return res.status(400).send("Fyll inn navn og e-post.");
  }

  const users = mongoose.connection.db.collection("users");
  let user = await users.findOne({ email });

  if (!user) {
    const role = email === ADMIN_EMAIL ? "admin" : "participant";
    await users.insertOne({ name, email, role, createdAt: new Date() });
    user = { name, email, role };
  } else {
    await users.updateOne({ email }, { $set: { name } });
    user.name = name;
  }

  const sessionId = randomUUID();
  sessions.set(sessionId, {
    name: user.name,
    email: user.email,
    role: user.role
  });
  res.cookie("sessionId", sessionId, { httpOnly: true, sameSite: "lax" });
  res.redirect(user.role === "admin" ? "/admin" : "/");
});
app.post("/admin/answers/:id/status", requireAdmin, async (req, res) => {
  const status = req.body.status;
  if (status !== "correct" && status !== "wrong") {
    return res.status(400).send("Ugyldig status.");
  }

  const changes = { status };
  if (status === "wrong") changes.winner = false;

  await mongoose.connection.db.collection("answers").updateOne(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    { $set: changes }
  );

  res.redirect("/admin");
});

app.post("/admin/winners/:questionId/draw", requireAdmin, async (req, res) => {
  const questionId = Number(req.params.questionId);
  const answers = mongoose.connection.db.collection("answers");
  const correctAnswers = await answers
    .find({ questionId, status: "correct" })
    .toArray();

  if (correctAnswers.length === 0) {
    return res.redirect("/admin?noCorrectAnswers=1");
  }

  const winner = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];

  await answers.updateMany({ questionId }, { $set: { winner: false } });
  await answers.updateOne(
    { _id: winner._id },
    { $set: { winner: true, wonAt: new Date() } }
  );

  res.redirect("/admin");
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(4000, () => {
      console.log("Server running at http://localhost:4000");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

startServer();


// app.listen(process.env.PORT,) () => {
//     console.log(`listening on http://localhost:$(process.env.PORT)`)
// }

