const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  codigo: { type: String },

  categoria: { type: String, required: true },
  marca: { type: String, required: true },
  descripcion: { type: String, required: true },
  color: { type: String, default: 'Ninguno' },
  codigoBarras: { type: String, default: '' },

  costoPieza: { type: Number, required: true },
  precioVenta: { type: Number, required: true },

  cantidad: { type: Number, required: true, default: 0 },
  stockBajo: { type: Number, default: 3 }, // umbral para alerta "Bajo stock"
}, { timestamps: true });

// Índice único por usuario + código (permite mismo código en diferentes usuarios)
inventorySchema.index({ userId: 1, codigo: 1 }, { unique: true });
// Auto-generar código
inventorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastItem = await mongoose.model('Inventory')
      .findOne({ userId: this.userId })
      .sort({ codigo: -1 })
      .select('codigo');

    let nextNumber = 100001;
    if (lastItem && lastItem.codigo) {
      const lastNumber = parseInt(lastItem.codigo.replace('COD', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    this.codigo = `COD${String(nextNumber)}`;
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
