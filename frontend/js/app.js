const API_URL = 'http://localhost:5000/api';
let allComponents = [];
let selectedBuild = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
});

async function loadComponents() {
  try {
    const res = await fetch(`${API_URL}/components`);
    allComponents = await res.json();
    renderCategories();
  } catch (err) {
    console.error('Error al cargar componentes:', err);
  }
}

function renderCategories() {
  const container = document.getElementById('categories-container');
  
  // Agrupar componentes por categoría
  const categories = [...new Set(allComponents.map(c => c.category_name))];

  container.innerHTML = categories.map(cat => {
    const items = allComponents.filter(c => c.category_name === cat);
    return `
      <div class="category-card">
        <h3>${cat}</h3>
        <select onchange="onComponentSelect('${cat}', this.value)">
          <option value="">-- Seleccionar ${cat} --</option>
          ${items.map(item => `
            <option value="${item.id}">
              ${item.brand} ${item.name} - $${item.price} MXN ${item.wattage ? `(${item.wattage}W)` : ''}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }).join('');
}

async function onComponentSelect(category, componentId) {
  if (componentId) {
    selectedBuild[category] = parseInt(componentId);
  } else {
    delete selectedBuild[category];
  }

  await validateBuild();
}

async function validateBuild() {
  const componentIds = Object.values(selectedBuild);
  const statusBox = document.getElementById('status-box');
  const btnSave = document.getElementById('btn-save');

  if (componentIds.length === 0) {
    statusBox.className = 'status-box info';
    statusBox.innerHTML = 'Selecciona componentes para empezar a validar.';
    document.getElementById('total-price').innerText = '0.00';
    document.getElementById('watt-consumption').innerText = '0';
    document.getElementById('psu-capacity').innerText = '0';
    btnSave.disabled = true;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/builds/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentIds })
    });

    const data = await res.json();

    document.getElementById('total-price').innerText = data.totalPrice.toFixed(2);
    document.getElementById('watt-consumption').innerText = data.totalWattageConsumed;
    document.getElementById('psu-capacity').innerText = data.psuWattageProvided;

    if (data.valid) {
      statusBox.className = 'status-box valid';
      statusBox.innerHTML = '✅ <strong>¡Ensamble Compatible!</strong> Todos los componentes son compatibles entre sí.';
      btnSave.disabled = false;
    } else {
      statusBox.className = 'status-box invalid';
      statusBox.innerHTML = '⚠️ <strong>Incompatibilidades detectadas:</strong><br>• ' + data.errors.join('<br>• ');
      btnSave.disabled = true;
    }

  } catch (err) {
    console.error('Error al validar:', err);
  }
}

async function saveCurrentBuild() {
  const componentIds = Object.values(selectedBuild);
  const totalPrice = parseFloat(document.getElementById('total-price').innerText);
  const totalWattage = parseInt(document.getElementById('watt-consumption').innerText);

  const buildName = prompt('Ingresa un nombre para tu cotización/ensamble:', 'PC Gaming Custom');

  if (!buildName) return;

  try {
    const res = await fetch(`${API_URL}/builds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        build_name: buildName,
        componentIds,
        total_price: totalPrice,
        total_wattage: totalWattage
      })
    });

    const data = await res.json();
    if (data.buildId) {
      alert(`🎉 ¡Cotización "${buildName}" guardada con éxito (ID: ${data.buildId})!`);
    }
  } catch (err) {
    alert('❌ Ocurrió un error al guardar la cotización.');
  }
}