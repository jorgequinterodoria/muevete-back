const { query } = require('../config/database');

class Role {
  // Obtener todos los roles
  static async findAll() {
    const result = await query(
      'SELECT * FROM roles ORDER BY name'
    );
    return result.rows;
  }

  // Buscar rol por nombre
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Buscar rol por ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Crear rol
  static async create({ name, description }) {
    const result = await query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }
}

module.exports = Role;