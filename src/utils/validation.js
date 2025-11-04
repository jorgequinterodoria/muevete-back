const Joi = require('joi');

// Esquemas de validación
const schemas = {
  // Validación para registro de usuario
  userRegistration: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    roleId: Joi.string().uuid().required().messages({
      'string.uuid': 'El ID del rol debe ser un UUID válido',
      'any.required': 'El rol es requerido'
    })
  }),
  
  // Validación para login
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  // Validación para ejercicios
  exercise: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(1000),
    muscleGroup: Joi.string().max(100),
    difficulty: Joi.string().valid('Principiante', 'Intermedio', 'Avanzado'),
    instructions: Joi.string().max(2000)
  }),
  
  // Validación para rutinas
  routine: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(1000),
    clientId: Joi.string().uuid().required(),
    trainerId: Joi.string().uuid(),
    exercises: Joi.array().items(
      Joi.object({
        exerciseId: Joi.string().uuid().required(),
        sets: Joi.number().integer().min(1).max(20),
        reps: Joi.number().integer().min(1).max(1000),
        weight: Joi.number().min(0).max(1000),
        restTime: Joi.number().integer().min(0).max(600),
        notes: Joi.string().max(500)
      })
    )
  }),
  
  // Validación para parámetros UUID
  uuid: Joi.string().uuid().required()
};

// Middleware de validación
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validar parámetros UUID
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const { error } = schemas.uuid.validate(req.params[paramName]);
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${paramName} debe ser un UUID válido`
      });
    }
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateUUID
};