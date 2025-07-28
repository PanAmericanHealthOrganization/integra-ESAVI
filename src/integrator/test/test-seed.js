// Script de prueba para el servicio de seed
const axios = require('axios');

const BASE_URL = 'http://localhost:8081';

async function testSeedService() {
  try {
    console.log('🧪 Probando servicio de seed...');
    
    // 1. Limpiar datos existentes
    console.log('1. Limpiando datos existentes...');
    const cleanResponse = await axios.delete(`${BASE_URL}/seed`);
    console.log('✅ Limpieza exitosa:', cleanResponse.data);
    
    // 2. Cargar datos de ejemplo
    console.log('2. Cargando datos de ejemplo...');
    const seedResponse = await axios.post(`${BASE_URL}/seed`);
    console.log('✅ Carga exitosa:', seedResponse.data);
    
    console.log('🎉 Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
testSeedService(); 