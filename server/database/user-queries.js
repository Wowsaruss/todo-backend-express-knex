const knex = require("./connection.js");

async function create(first_name, last_name, email, password) {
    const results = await knex('users').insert({ first_name, last_name, email, password }).returning('*');
    return results[0];
}

module.exports = { create }