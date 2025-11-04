const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Crear usuario
  static async create({ email, name, password, roleId }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, name, password_hash, role_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role_id, is_active, created_at`,
      [email, name, hashedPassword, roleId]
    );
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const result = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );
    return result.rows[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    const result = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.is_active = true`,
      [id]
    );
    return result.rows[0];
  }

  // Obtener todos los usuarios con paginación
  static async findAll({ page = 1, limit = 10, role = null }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE u.is_active = true';
    let params = [limit, offset];
    
    if (role) {
      whereClause += ' AND r.name = $3';
      params.push(role);
    }

    const result = await query(
      `SELECT u.id, u.email, u.name, u.is_active, u.created_at, r.name as role_name
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ${whereClause}
       ORDER BY u.created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ${whereClause}`,
      role ? [role] : []
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar usuario
  static async update(id, { name, email, roleId }) {
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($2, name), 
           email = COALESCE($3, email), 
           role_id = COALESCE($4, role_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_active = true
       RETURNING id, email, name, role_id, updated_at`,
      [id, name, email, roleId]
    );
    return result.rows[0];
  }

  // Desactivar usuario (soft delete)
  static async deactivate(id) {
    const result = await query(
      `UPDATE users 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    return result.rows[0];
  }

  // Cambiar contraseña
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await query(
      `UPDATE users 
       SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_active = true
       RETURNING id`,
      [id, hashedPassword]
    );
    return result.rows[0];
  }
}

module.exports = User;