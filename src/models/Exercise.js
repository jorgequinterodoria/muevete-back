const { query } = require('../config/database');

class Exercise {
  // Crear ejercicio
  static async create({ name, description, muscleGroup, difficulty, instructions, createdBy }) {
    const result = await query(
      `INSERT INTO exercises (name, description, muscle_group, difficulty, instructions, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, muscleGroup, difficulty, instructions, createdBy]
    );
    return result.rows[0];
  }

  // Obtener todos los ejercicios
  static async findAll({ page = 1, limit = 10, muscleGroup = null, difficulty = null }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [limit, offset];
    let paramCount = 2;
    
    if (muscleGroup) {
      whereClause += ` AND muscle_group = $${++paramCount}`;
      params.push(muscleGroup);
    }
    
    if (difficulty) {
      whereClause += ` AND difficulty = $${++paramCount}`;
      params.push(difficulty);
    }

    const result = await query(
      `SELECT e.*, u.name as created_by_name
       FROM exercises e 
       LEFT JOIN users u ON e.created_by = u.id
       ${whereClause}
       ORDER BY e.created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM exercises ${whereClause}`,
      params.slice(2)
    );

    return {
      exercises: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Buscar ejercicio por ID
  static async findById(id) {
    const result = await query(
      `SELECT e.*, u.name as created_by_name
       FROM exercises e 
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Actualizar ejercicio
  static async update(id, { name, description, muscleGroup, difficulty, instructions }) {
    const result = await query(
      `UPDATE exercises 
       SET name = COALESCE($2, name), 
           description = COALESCE($3, description), 
           muscle_group = COALESCE($4, muscle_group),
           difficulty = COALESCE($5, difficulty),
           instructions = COALESCE($6, instructions),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, name, description, muscleGroup, difficulty, instructions]
    );
    return result.rows[0];
  }

  // Eliminar ejercicio
  static async delete(id) {
    const result = await query(
      'DELETE FROM exercises WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Exercise;