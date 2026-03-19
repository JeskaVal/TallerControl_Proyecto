const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

// GET /api/orders — listar todas las órdenes del usuario
router.get('/', async (req, res) => {
  try {
    const { estatus, search } = req.query;
    let query = { userId: req.user.userId };

    if (estatus && estatus !== 'TODAS') {
      query.estatus = estatus;
    }

    if (search) {
      query.$or = [
        { folio: { $regex: search, $options: 'i' } },
        { nombreCliente: { $regex: search, $options: 'i' } },
        { marca: { $regex: search, $options: 'i' } },
        { modelo: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

// GET /api/orders/summary — resumen para el dashboard
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [nuevos, reparando, vencidos, terminados] = await Promise.all([
      Order.countDocuments({ userId, estatus: 'PENDIENTE' }),
      Order.countDocuments({ userId, estatus: 'EN_PROCESO' }),
      Order.countDocuments({ userId, estatus: 'VENCIDO' }),
      Order.countDocuments({ userId, estatus: 'TERMINADO' }),
    ]);
    const ultimas = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5);
    res.json({ nuevos, reparando, vencidos, terminados, ultimas });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
});

// GET /api/orders/:id — obtener una orden
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

// POST /api/orders — crear nueva orden
router.post('/', async (req, res) => {
  try {
    const {
      nombreCliente, telefono, categoria, marca, modelo, serie,
      fallas, piezas, totalEstimado, anticipo, fechaEntregaEstimada
    } = req.body;

    const order = new Order({
      userId: req.user.userId,
      nombreCliente, telefono, categoria, marca, modelo, serie,
      fallas, piezas, totalEstimado, anticipo, fechaEntregaEstimada,
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear la orden' });
  }
});

// PUT /api/orders/:id — editar orden completa
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar la orden' });
  }
});

// PATCH /api/orders/:id/status — cambiar solo estatus y comentario
router.patch('/:id/status', async (req, res) => {
  try {
    const { estatus, comentarios } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { estatus, comentarios } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estatus' });
  }
});

// DELETE /api/orders/:id — eliminar orden
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json({ message: 'Orden eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la orden' });
  }
});

module.exports = router;
