const mongoose = require('mongoose');

const piezaSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  precio: { type: Number, required: true },
  inventarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', default: null },
});

const orderSchema = new mongoose.Schema({
  folio: { type: String, unique: true }, // REP-00001
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Datos cliente
  nombreCliente: { type: String, required: true, trim: true },
  telefono: { type: String, required: true, trim: true },

  // Datos equipo
  categoria: { type: String, required: true }, // Laptop, Smartphone, Consola, etc.
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  serie: { type: String, default: '' },

  // Reparación
  fallas: [{ type: String }],
  piezas: [piezaSchema],

  // Estatus
  estatus: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROCESO', 'EN_ESPERA', 'TERMINADO', 'ENTREGADO', 'CANCELADO', 'VENCIDO'],
    default: 'PENDIENTE'
  },
  comentarios: { type: String, default: '' },

  // Financiero
  totalEstimado: { type: Number, default: 0 },
  anticipo: { type: Number, default: 0 },

  fechaEntregaEstimada: { type: Date, default: null },
}, { timestamps: true });

// Auto-generar folio antes de guardar
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments({ userId: this.userId });
    const number = String(count + 1).padStart(5, '0');
    this.folio = `REP-${number}`;
  }
  next();
});

// Virtual: total restante
orderSchema.virtual('totalRestante').get(function () {
  return this.totalEstimado - this.anticipo;
});

orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
