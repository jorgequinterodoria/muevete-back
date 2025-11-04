const express = require('express');
const { body, validationResult } = require('express-validator');
const Routine = require('../models/Routine');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener rutinas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routines = await Routine.findByUserId(req.user.userId);
    
    res.json({
      success: true,
      data: routines
    });
  } catch (error) {
    console.error('Error obteniendo rutinas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva rutina
router.post('/', [
  authenticateToken,
  body('name').trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('exercises').isArray().withMessage('exercises debe ser un array'),
  body('exercises.*.exercise_id').isUUID().withMessage('exercise_id debe ser un UUID válido'),
  body('exercises.*.sets').optional().isInt({ min: 1 }),
  body('exercises.*.reps').optional().isInt({ min: 1 }),
  body('exercises.*.weight').optional().isFloat({ min: 0 }),
  body('exercises.*.duration').optional().isInt({ min: 1 }),
  body('exercises.*.rest_time').optional().isInt({ min: 0 })
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

    const routineData = {
      name: req.body.name,
      description: req.body.description || null,
      user_id: req.user.userId,
      exercises: req.body.exercises
    };

    const newRoutine = await Routine.create(routineData);
    
    res.status(201).json({
      success: true,
      message: 'Rutina creada exitosamente',
      data: newRoutine
    });
  } catch (error) {
    console.error('Error creando rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener rutina por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const routine = await Routine.findByIdWithExercises(req.params.id);
    
    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    // Verificar que la rutina pertenece al usuario (o es admin)
    if (routine.user_id !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta rutina'
      });
    }

    res.json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Error obteniendo rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar rutina
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('exercises').optional().isArray()
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

    // Verificar que la rutina existe y pertenece al usuario
    const existingRoutine = await Routine.findById(req.params.id);
    if (!existingRoutine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    if (existingRoutine.user_id !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta rutina'
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.exercises) updateData.exercises = req.body.exercises;

    const updatedRoutine = await Routine.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: 'Rutina actualizada exitosamente',
      data: updatedRoutine
    });
  } catch (error) {
    console.error('Error actualizando rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar rutina
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar que la rutina existe y pertenece al usuario
    const existingRoutine = await Routine.findById(req.params.id);
    if (!existingRoutine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    if (existingRoutine.user_id !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta rutina'
      });
    }

    const deleted = await Routine.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Rutina eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;