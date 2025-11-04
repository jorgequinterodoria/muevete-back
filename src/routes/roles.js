const express = require('express');
const Role = require('../models/Role');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los roles (solo admin)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const roles = await Role.findAll();
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener rol por ID (solo admin)
router.get('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;