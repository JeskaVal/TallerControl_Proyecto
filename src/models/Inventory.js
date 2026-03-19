const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  codigo: { type: String, unique: true },

  categoria: { type: String, required: true },
  marca: { type: String, required: true },
  descripcion: { type: String, required: true },
  color: { type: String, default: 'Ninguno' },
  codigoBarras: { type: String, default: '' },

  costoPieza: { type: Number, required: true },
  precioVenta: { type: Number, required: true },

  cantidad: { type: Number, required: true, default: 0 },
  stockBajo: { type: Number, default: 5 }, // umbral para alerta "Bajo stock"
}, { timestamps: true });

// Auto-generar código
inventorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Inventory').countDocuments({ userId: this.userId });
    const number = String(count + 100000 + 1).padStart(6, '0');
    this.codigo = `COD${number}`;
  }
  next();
});

// Virtual: estado de stock
inventorySchema.virtual('estadoStock').get(function () {
  if (this.cantidad === 0) return 'AGOTADO';
  if (this.cantidad <= this.stockBajo) return 'BAJO_STOCK';
  return 'EN_STOCK';
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
