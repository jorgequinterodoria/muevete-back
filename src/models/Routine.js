const { query, getClient } = require('../config/database');

class Routine {
  // Crear rutina con ejercicios
  static async create({ name, description, clientId, trainerId, exercises = [] }) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Crear la rutina
      const routineResult = await client.query(
        `INSERT INTO routines (name, description, client_id, trainer_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, description, clientId, trainerId]
      );
      
      const routine = routineResult.rows[0];
      
      // Agregar ejercicios a la rutina
      if (exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const exercise = exercises[i];
          await client.query(
            `INSERT INTO routine_exercises 
             (routine_id, exercise_id, sets, reps, weight, rest_time, order_in_routine, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              routine.id,
              exercise.exerciseId,
              exercise.sets,
              exercise.reps,
              exercise.weight,
              exercise.restTime,
              i + 1,
              exercise.notes
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      return routine;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener rutinas con filtros
  static async findAll({ page = 1, limit = 10, clientId = null, trainerId = null }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE r.is_active = true';
    let params = [limit, offset];
    let paramCount = 2;
    
    if (clientId) {
      whereClause += ` AND r.client_id = $${++paramCount}`;
      params.push(clientId);
    }
    
    if (trainerId) {
      whereClause += ` AND r.trainer_id = $${++paramCount}`;
      params.push(trainerId);
    }

    const result = await query(
      `SELECT r.*, 
              c.name as client_name, c.email as client_email,
              t.name as trainer_name, t.email as trainer_email
       FROM routines r 
       JOIN users c ON r.client_id = c.id
       LEFT JOIN users t ON r.trainer_id = t.id
       ${whereClause}
       ORDER BY r.created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM routines r ${whereClause}`,
      params.slice(2)
    );

    return {
      routines: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Buscar rutina por ID con ejercicios
  static async findById(id) {
    const routineResult = await query(
      `SELECT r.*, 
              c.name as client_name, c.email as client_email,
              t.name as trainer_name, t.email as trainer_email
       FROM routines r 
       JOIN users c ON r.client_id = c.id
       LEFT JOIN users t ON r.trainer_id = t.id
       WHERE r.id = $1 AND r.is_active = true`,
      [id]
    );
    
    if (routineResult.rows.length === 0) {
      return null;
    }
    
    const routine = routineResult.rows[0];
    
    // Obtener ejercicios de la rutina
    const exercisesResult = await query(
      `SELECT re.*, e.name as exercise_name, e.description as exercise_description,
              e.muscle_group, e.difficulty, e.instructions
       FROM routine_exercises re
       JOIN exercises e ON re.exercise_id = e.id
       WHERE re.routine_id = $1
       ORDER BY re.order_in_routine`,
      [id]
    );
    
    routine.exercises = exercisesResult.rows;
    return routine;
  }

  // Actualizar rutina
  static async update(id, { name, description, isActive }) {
    const result = await query(
      `UPDATE routines 
       SET name = COALESCE($2, name), 
           description = COALESCE($3, description), 
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id, name, description, isActive]
    );
    return result.rows[0];
  }

  // Desactivar rutina
  static async deactivate(id) {
    const result = await query(
      `UPDATE routines 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    return result.rows[0];
  }

  // Agregar ejercicio a rutina
  static async addExercise(routineId, { exerciseId, sets, reps, weight, restTime, notes }) {
    // Obtener el siguiente orden
    const orderResult = await query(
      'SELECT COALESCE(MAX(order_in_routine), 0) + 1 as next_order FROM routine_exercises WHERE routine_id = $1',
      [routineId]
    );
    
    const nextOrder = orderResult.rows[0].next_order;
    
    const result = await query(
      `INSERT INTO routine_exercises 
       (routine_id, exercise_id, sets, reps, weight, rest_time, order_in_routine, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [routineId, exerciseId, sets, reps, weight, restTime, nextOrder, notes]
    );
    
    return result.rows[0];
  }

  // Remover ejercicio de rutina
  static async removeExercise(routineId, exerciseId) {
    const result = await query(
      'DELETE FROM routine_exercises WHERE routine_id = $1 AND exercise_id = $2 RETURNING *',
      [routineId, exerciseId]
    );
    return result.rows[0];
  }
}

module.exports = Routine;