const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error MongoDB:', err));


const cron = require('node-cron');
const Order = require('./models/Order');

// Ejecuta cada hora — marca como VENCIDO las órdenes que pasaron su fecha compromiso
cron.schedule('0 * * * *', async () => {
    try {
        const ahora = new Date();
        const resultado = await Order.updateMany(
            {
                fechaEntregaEstimada: { $lt: ahora, $ne: null },
                estatus: { $nin: ['TERMINADO', 'ENTREGADO', 'CANCELADO', 'VENCIDO'] }
            },
            { $set: { estatus: 'VENCIDO' } }
        );
        if (resultado.modifiedCount > 0) {
            console.log(`⚠️ ${resultado.modifiedCount} orden(es) marcadas como VENCIDO`);
        }
    } catch (err) {
        console.error('Error al verificar fechas vencidas:', err);
    }
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/inventory', verifyToken, inventoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'TallerControl API running 🔧', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
