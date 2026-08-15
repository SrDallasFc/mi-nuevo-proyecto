const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// 1. Obtener todos los componentes por categoría
app.get('/api/components', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, cat.name AS category_name 
      FROM components c 
      JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.category_id, c.price ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar componentes' });
  }
});

// 2. Validar compatibilidad de una lista de componentes seleccionados
app.post('/api/builds/validate', async (req, res) => {
  const { componentIds } = req.body; // Array de IDs seleccionados: [1, 4, 7, 9]

  if (!componentIds || componentIds.length === 0) {
    return res.status(400).json({ valid: false, errors: ['No se enviaron componentes'] });
  }

  try {
    // Consultar detalles de los componentes seleccionados
    const [selected] = await pool.query(
      `SELECT c.*, cat.name as category_name 
       FROM components c 
       JOIN categories cat ON c.category_id = cat.id 
       WHERE c.id IN (?)`,
      [componentIds]
    );

    const errors = [];
    let totalPrice = 0;
    let totalWattageConsumed = 0;
    let psuWattageProvided = 0;

    let cpu = selected.find(c => c.category_name === 'Procesador');
    let motherboard = selected.find(c => c.category_name === 'Tarjeta Madre');
    let ram = selected.find(c => c.category_name === 'Memoria RAM');
    let psu = selected.find(c => c.category_name === 'Fuente de Poder');

    // Calcular costos y consumo de Watts
    selected.forEach(c => {
      totalPrice += parseFloat(c.price);
      if (c.category_name === 'Fuente de Poder') {
        psuWattageProvided = c.wattage;
      } else {
        totalWattageConsumed += c.wattage;
      }
    });

    // --- REGLAS DE COMPATIBILIDAD ---

    // 1. Socket Procesador vs Tarjeta Madre
    if (cpu && motherboard) {
      if (cpu.socket !== motherboard.socket) {
        errors.push(`Incompatibilidad de Socket: El procesador (${cpu.name}) usa socket ${cpu.socket}, pero la Tarjeta Madre (${motherboard.name}) usa ${motherboard.socket}.`);
      }
    }

    // 2. Tipo de RAM vs Tarjeta Madre
    if (ram && motherboard) {
      if (ram.ram_type !== motherboard.ram_type) {
        errors.push(`Incompatibilidad de RAM: La memoria RAM (${ram.name}) es ${ram.ram_type}, pero la Tarjeta Madre es compatible con ${motherboard.ram_type}.`);
      }
    }

    // 3. Potencia de la Fuente de Poder
    if (psu && totalWattageConsumed > 0) {
      if (psuWattageProvided < totalWattageConsumed + 100) { // Margen de seguridad de 100W
        errors.push(`Potencia Insuficiente: El ensamble consume aprox. ${totalWattageConsumed}W (se recomiendan ${totalWattageConsumed + 100}W), pero la fuente seleccionada solo entrega ${psuWattageProvided}W.`);
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      totalPrice,
      totalWattageConsumed,
      psuWattageProvided
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar la configuración' });
  }
});

// 3. Guardar Ensamble / Cotización
app.post('/api/builds', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { build_name, componentIds, total_price, total_wattage } = req.body;

    const [buildResult] = await connection.query(
      'INSERT INTO builds (build_name, total_price, total_wattage) VALUES (?, ?, ?)',
      [build_name || 'Mi Ensamble Custom', total_price, total_wattage]
    );
    const buildId = buildResult.insertId;

    for (const compId of componentIds) {
      await connection.query(
        'INSERT INTO build_items (build_id, component_id) VALUES (?, ?)',
        [buildId, compId]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Ensamble guardado exitosamente', buildId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la cotización' });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PC Builder API corriendo en puerto ${PORT}`);
});