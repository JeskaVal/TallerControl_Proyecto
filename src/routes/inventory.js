const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const { stock, search } = req.query;
    let items = await Inventory.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    // Filtrar por estado de stock
    if (stock === 'EN_STOCK') items = items.filter(i => i.estadoStock === 'EN_STOCK');
    else if (stock === 'BAJO_STOCK') items = items.filter(i => i.estadoStock === 'BAJO_STOCK');
    else if (stock === 'AGOTADO') items = items.filter(i => i.estadoStock === 'AGOTADO');

    // Búsqueda
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(i =>
        i.descripcion.toLowerCase().includes(s) ||
        i.categoria.toLowerCase().includes(s) ||
        i.codigo.toLowerCase().includes(s)
      );
    }

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { categoria, marca, descripcion, color, codigoBarras, costoPieza, precioVenta, cantidad, stockBajo } = req.body;
    const item = new Inventory({
      userId: req.user.userId,
      categoria, marca, descripcion, color, codigoBarras,
      costoPieza, precioVenta, cantidad, stockBajo,
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el producto' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar' });
  }
});

module.exports = router;
