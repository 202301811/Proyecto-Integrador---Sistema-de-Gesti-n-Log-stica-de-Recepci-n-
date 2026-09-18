require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const proveedorRoutes = require('./routes/proveedores');
const pedidoRoutes = require('./routes/pedidos');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestion_proveedores';

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/pedidos', pedidoRoutes);

// Conexión a MongoDB y arranque
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado exitosamente a MongoDB local');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
  });