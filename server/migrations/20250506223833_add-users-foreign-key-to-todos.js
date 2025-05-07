/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
return knex.schema.table('todos', table => {
    table.integer('user_id')
    .unsigned()
    .index()
    .references('id')
    .inTable('users');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
return knex.schema.table('todos', table => {
    table.dropColumn('user_id');
  })
};
