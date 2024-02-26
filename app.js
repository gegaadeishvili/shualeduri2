const express = require("express");
const middleware = require("./middleware");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

let db = new sqlite3.Database("./expenses.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the chinook database.");
});
//

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS expenses");
  db.run(`CREATE TABLE expenses (
            id INTEGER PRIMARY KEY,
            info TEXT NOT NULL)`);

  const stmt = db.prepare("INSERT INTO expenses (info) VALUES (?)");
  for (let i = 0; i < 10; i++) {
    stmt.run(i);
  }
  stmt.finalize();

  db.each("SELECT id, info FROM expenses", (err, row) => {
    console.log(row.id + ": " + row.info + "$");
  });
});

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(middleware.logUserAgent);

app.get("/", (req, res) => {
  db.all("SELECT * FROM expenses", (err, rows) => {
    if (err) {
      throw err;
    }

    res.render("index", { expenses: rows });
  });
});

app.get("/expenses/:id", function (req, res) {
  db.get(`SELECT * FROM expenses WHERE id = ?`, req.params.id, (err, row) => {
    if (err) {
      throw err;
    }

    res.render("expense", { expense: row });
  });
});

app.post("/delete/:id", function (req, res) {
  db.run("DELETE FROM expenses WHERE id=(?)", req.params.id, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successful");
    }
  });
  res.redirect("/");
});

app.post("/add", function (req, res) {
  db.run(
    "INSERT INTO expenses (info) VALUES (?)",
    req.body.amount,
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successful");
      }
    }
  );
  res.redirect("/");
});

app.post("/update/:id", function (req, res) {
  db.run(
    "UPDATE expenses SET info = (?) WHERE id = (?)",
    req.body.amount,
    req.params.id,
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successful");
      }
    }
  );
  res.redirect("/");
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
