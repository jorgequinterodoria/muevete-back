-- Tabla unificada de usuarios (incluye tanto admins como clientes)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Campos específicos para clientes (NULL para admins)
    phone VARCHAR(20),
    birth_date DATE,
    registration_date DATE,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de ejercicios
CREATE TABLE exercises (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    primary_muscle VARCHAR(100) NOT NULL,
    secondary_muscles TEXT[],
    type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    equipment VARCHAR(255),
    instructions TEXT[],
    media_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de rutinas diarias
CREATE TABLE day_routines (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL, -- Referencia directa a users con role='client'
    week INTEGER NOT NULL,
    day VARCHAR(20) NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(client_id, week, day)
);

-- Crear tabla de ejercicios de rutina
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL,
    exercise_id VARCHAR(50) NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight DECIMAL(5,2),
    rest INTEGER NOT NULL,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES day_routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Insertar datos demo
INSERT INTO users (id, email, name, role, password_hash, phone, birth_date, registration_date, status, notes) VALUES
-- Admin (campos de cliente en NULL)
('admin-1', 'admin@gym.com', 'Admin Principal', 'admin', '$2b$10$example_hash_for_gym123', NULL, NULL, NULL, NULL, NULL),
-- Clientes (con todos sus datos)
('client-1', 'cliente@gym.com', 'Juan Pérez', 'client', '$2b$10$example_hash_for_gym123', '+34 600 123 456', '1990-05-15', '2024-01-15', 'active', 'Objetivo: ganar masa muscular'),
('client-2', 'maria@email.com', 'María García', 'client', '$2b$10$example_hash_for_gym123', '+34 600 987 654', '1985-08-22', '2024-02-01', 'active', 'Objetivo: perder peso');

-- Insertar ejercicios demo
INSERT INTO exercises (id, name, description, primary_muscle, secondary_muscles, type, difficulty, equipment, instructions) VALUES
('ex-1', 'Press de Banca', 'Ejercicio fundamental para el desarrollo del pecho', 'Pecho', ARRAY['Tríceps', 'Hombros'], 'Fuerza', 'intermediate', 'Barra y discos', ARRAY[
    'Acuéstate en el banco con los pies firmes en el suelo',
    'Agarra la barra con un agarre ligeramente más ancho que los hombros',
    'Baja la barra controladamente hasta el pecho',
    'Empuja la barra hacia arriba hasta la extensión completa'
]),
('ex-2', 'Sentadilla', 'Ejercicio compuesto fundamental para tren inferior', 'Cuádriceps', ARRAY['Glúteos', 'Isquiotibiales'], 'Fuerza', 'beginner', 'Barra y discos', ARRAY[
    'Coloca la barra sobre los trapecios',
    'Mantén los pies separados al ancho de los hombros',
    'Desciende flexionando las rodillas y caderas',
    'Mantén el pecho erguido y la espalda recta',
    'Asciende empujando con los talones'
]),
('ex-3', 'Peso Muerto', 'Ejercicio compuesto para toda la cadena posterior', 'Isquiotibiales', ARRAY['Glúteos', 'Espalda', 'Trapecios'], 'Fuerza', 'intermediate', 'Barra y discos', ARRAY[
    'Coloca los pies debajo de la barra',
    'Agarra la barra con las manos separadas al ancho de los hombros',
    'Mantén la espalda recta y el pecho erguido',
    'Levanta la barra extendiendo caderas y rodillas simultáneamente'
]),
('ex-4', 'Dominadas', 'Ejercicio de tracción para el desarrollo de la espalda', 'Espalda', ARRAY['Bíceps', 'Hombros'], 'Fuerza', 'intermediate', 'Barra de dominadas', ARRAY[
    'Cuelga de la barra con agarre pronado',
    'Mantén los brazos completamente extendidos',
    'Tira hacia arriba hasta que el mentón pase la barra',
    'Desciende controladamente hasta la posición inicial'
]),
('ex-5', 'Flexiones', 'Ejercicio de empuje para pecho y tríceps', 'Pecho', ARRAY['Tríceps', 'Hombros'], 'Fuerza', 'beginner', 'Peso corporal', ARRAY[
    'Colócate en posición de plancha',
    'Mantén el cuerpo recto desde la cabeza hasta los pies',
    'Baja el pecho hacia el suelo flexionando los brazos',
    'Empuja hacia arriba hasta la posición inicial'
]);

-- Crear índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_day_routines_client_week ON day_routines(client_id, week);
CREATE INDEX idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);

-- Constraint para asegurar que solo los clientes tengan datos de cliente
ALTER TABLE users ADD CONSTRAINT check_client_data 
    CHECK (
        (role = 'admin' AND phone IS NULL AND birth_date IS NULL AND registration_date IS NULL AND status IS NULL) OR
        (role = 'client' AND registration_date IS NOT NULL AND status IS NOT NULL)
    );