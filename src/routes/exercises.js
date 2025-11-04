const express = require('express');
const { body, validationResult } = require('express-validator');
const Exercise = require('../models/Exercise');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los ejercicios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    
    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('Error obteniendo ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo ejercicio (solo admin)
router.post('/', [
  authenticateToken,
  requireRole(['ADMIN']),
  body('name').trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('muscle_group').optional().trim(),
  body('equipment').optional().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const exerciseData = {
      name: req.body.name,
      description: req.body.description || null,
      muscle_group: req.body.muscle_group || null,
      equipment: req.body.equipment || null,
      difficulty: req.body.difficulty || 'beginner'
    };

    const newExercise = await Exercise.create(exerciseData);
    
    res.status(201).json({
      success: true,
      message: 'Ejercicio creado exitosamente',
      data: newExercise
    });
  } catch (error) {
    console.error('Error creando ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener ejercicio por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('Error obteniendo ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar ejercicio (solo admin)
router.put('/:id', [
  authenticateToken,
  requireRole(['ADMIN']),
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('muscle_group').optional().trim(),
  body('equipment').optional().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.muscle_group !== undefined) updateData.muscle_group = req.body.muscle_group;
    if (req.body.equipment !== undefined) updateData.equipment = req.body.equipment;
    if (req.body.difficulty) updateData.difficulty = req.body.difficulty;

    const updatedExercise = await Exercise.update(req.params.id, updateData);
    
    if (!updatedExercise) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Ejercicio actualizado exitosamente',
      data: updatedExercise
    });
  } catch (error) {
    console.error('Error actualizando ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar ejercicio (solo admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const deleted = await Exercise.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Ejercicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Ejercicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;