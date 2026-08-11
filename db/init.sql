CREATE DATABASE IF NOT EXISTS pc_builder_db;
USE pc_builder_db;

-- Categorías (Procesadores, Tarjetas Madre, RAM, GPU, Fuente, Almacenamiento)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Componentes de Hardware con Especificaciones Técnicas
CREATE TABLE IF NOT EXISTS components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    socket VARCHAR(20) DEFAULT NULL,      -- Ej: AM4, AM5, LGA1700
    ram_type VARCHAR(10) DEFAULT NULL,    -- Ej: DDR4, DDR5
    wattage INT DEFAULT 0,                 -- Consumo de energía (TDP) o Potencia entregada
    stock INT DEFAULT 10,
    image_url VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Ensambles / Cotizaciones guardadas
CREATE TABLE IF NOT EXISTS builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    build_name VARCHAR(100) DEFAULT 'Mi Ensamble Custom',
    total_price DECIMAL(10,2) NOT NULL,
    total_wattage INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detalle de Componentes por Ensamble
CREATE TABLE IF NOT EXISTS build_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    build_id INT NOT NULL,
    component_id INT NOT NULL,
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES components(id)
);

-- Insertar Categorías Básicas
INSERT INTO categories (name) VALUES 
('Procesador'), 
('Tarjeta Madre'), 
('Memoria RAM'), 
('Tarjeta de Video'), 
('Fuente de Poder'), 
('Almacenamiento');

-- Insertar Componentes de Ejemplo con Datos de Compatibilidad
INSERT INTO components (category_id, name, brand, price, socket, ram_type, wattage) VALUES
-- Procesadores
(1, 'AMD Ryzen 5 5600X', 'AMD', 2800.00, 'AM4', 'DDR4', 65),
(1, 'AMD Ryzen 7 7800X3D', 'AMD', 7200.00, 'AM5', 'DDR5', 120),
(1, 'Intel Core i5-13400F', 'Intel', 3400.00, 'LGA1700', 'DDR5', 65),

-- Tarjetas Madre
(2, 'B550M DS3H', 'Gigabyte', 1900.00, 'AM4', 'DDR4', 30),
(2, 'B650 AORUS ELITE AX', 'Gigabyte', 4100.00, 'AM5', 'DDR5', 40),
(2, 'B760M GAMING PLUS WIFI', 'MSI', 2800.00, 'LGA1700', 'DDR5', 35),

-- Memoria RAM
(3, 'Kingston Fury Beast 16GB (1x16GB) 3200MHz', 'Kingston', 750.00, NULL, 'DDR4', 5),
(3, 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz', 'Corsair', 2200.00, NULL, 'DDR5', 10),

-- Tarjetas de Video
(4, 'NVIDIA GeForce RTX 4060 8GB', 'ASUS', 6200.00, NULL, NULL, 115),
(4, 'NVIDIA GeForce RTX 4070 Super 12GB', 'MSI', 12800.00, NULL, NULL, 220),

-- Fuentes de Poder (En wattage ponemos la potencia que proveen)
(5, 'EVGA 600 W1 600W 80+ White', 'EVGA', 1100.00, NULL, NULL, 600),
(5, 'Corsair RM750e 750W 80+ Gold', 'Corsair', 2300.00, NULL, NULL, 750),

-- Almacenamiento
(6, 'SSD NVMe M.2 Kingston NV2 1TB', 'Kingston', 1150.00, NULL, NULL, 5);