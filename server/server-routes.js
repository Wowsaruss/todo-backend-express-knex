const _ = require("lodash");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const todos = require("./database/todo-queries.js");
const users = require("./database/user-queries.js");

function createUser(req, data) {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: data.password,
  };
}

function createToDo(req, data) {
  const protocol = req.protocol,
    host = req.get("host"),
    id = data.id;

  return {
    user_id: req.params.user_id,
    title: data.title,
    order: data.order,
    completed: data.completed || false,
    url: `${protocol}://${host}/${id}`,
  };
}

const postUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await users.create(
      first_name,
      last_name,
      email,
      hashedPassword
    );

    res.status(201).json({
      message: "User created successfully",
      user: { email: newUser.email },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await users.get(email);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Sign JWT
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

async function getUser(req, res) {
  const created = await users.get(req.params.email);
  return res.send(createUser(req, created));
}

async function getAllTodos(req, res) {
  const allEntries = await todos.all();
  return res.send(allEntries.map(_.curry(createToDo)(req)));
}

async function getTodo(req, res) {
  const todo = await todos.get(req.params.id);
  return res.send(todo);
}

async function postTodo(req, res) {
  const created = await todos.create(
    req.params.user_id,
    req.body.title,
    req.body.order
  );
  return res.send(createToDo(req, created));
}

async function patchTodo(req, res) {
  const patched = await todos.update(req.params.id, req.body);
  return res.send(createToDo(req, patched));
}

async function deleteAllTodos(req, res) {
  const deletedEntries = await todos.clear();
  return res.send(deletedEntries.map(_.curry(createToDo)(req)));
}

async function deleteTodo(req, res) {
  const deleted = await todos.delete(req.params.id);
  return res.send(createToDo(req, deleted));
}

function addErrorReporting(func, message) {
  return async function (req, res) {
    try {
      return await func(req, res);
    } catch (err) {
      console.log(`${message} caused by: ${err}`);

      // Not always 500, but for simplicity's sake.
      res.status(500).send(`Opps! ${message}.`);
    }
  };
}

const toExport = {
  postUser: { method: postUser, errorMessage: "Could not post user" },
  loginUser: { method: loginUser, errorMessage: "Could not login user" },
  getUser: { method: getUser, errorMessage: "Could not get user" },
  getAllTodos: {
    method: getAllTodos,
    errorMessage: "Could not fetch all todos",
  },
  getTodo: { method: getTodo, errorMessage: "Could not fetch todo" },
  postTodo: { method: postTodo, errorMessage: "Could not post todo" },
  patchTodo: { method: patchTodo, errorMessage: "Could not patch todo" },
  deleteAllTodos: {
    method: deleteAllTodos,
    errorMessage: "Could not delete all todos",
  },
  deleteTodo: { method: deleteTodo, errorMessage: "Could not delete todo" },
};

for (let route in toExport) {
  toExport[route] = addErrorReporting(
    toExport[route].method,
    toExport[route].errorMessage
  );
}

module.exports = toExport;
