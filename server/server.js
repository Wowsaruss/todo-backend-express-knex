require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("./server-config.js");
const routes = require("./server-routes.js");
const users = require("./database/user-queries.js");

const port = process.env.PORT || 5000;

app.post("/login", routes.loginUser);

app.post("/users", routes.postUser);
app.get("/users/:email", routes.postUser);

app.get("/", routes.getAllTodos);
app.get("/:id", routes.getTodo);

app.post("/:user_id", routes.postTodo);
app.patch("/:id", routes.patchTodo);

app.delete("/", routes.deleteAllTodos);
app.delete("/:id", routes.deleteTodo);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = app;
