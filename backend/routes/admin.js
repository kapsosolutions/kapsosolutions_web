import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import cloudinaryService from '../services/cloudinary.js';
import Category from '../models/Category.js';
import FlowSetting from '../models/FlowSetting.js';
import DemoLead from '../models/DemoLead.js';
import { DEFAULTS } from '../services/settings.js';
import logger from '../services/logger.js';

const router = express.Router();

// ---------------- Auth ----------------
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (
    username === (process.env.ADMIN_USERNAME || 'admin') &&
    password === (process.env.ADMIN_PASSWORD || 'admin')
  ) {
    return res.json({
      success: true,
      token: process.env.ADMIN_TOKEN || 'kapso_admin_session_token_2026',
      user: { username, role: 'Administrator' }
    });
  }
  res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

// All routes below require the admin bearer token.
router.use(requireAdmin);

// ---------------- Categories ----------------
router.get('/categories', async (_req, res) => {
  const cats = await Category.find().sort({ order: 1, createdAt: 1 });
  res.json({ success: true, data: cats });
});

router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    let imageUrl = '';
    if (req.file) imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, 'kapso/categories');
    const cat = new Category({ name: name.trim(), imageUrl, order: Number(order) || 0 });
    await cat.save();
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Category already exists' });
    logger.error('create category failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, order, active } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (order !== undefined) update.order = Number(order) || 0;
    if (active !== undefined) update.active = active === 'true' || active === true;
    if (req.file) update.imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, 'kapso/categories');
    const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
  if (cat.imageUrl) cloudinaryService.deleteByUrl(cat.imageUrl).catch(() => {});
  res.json({ success: true, message: 'Deleted' });
});

// ---------------- Flow settings (images + copy) ----------------
router.get('/settings', async (_req, res) => {
  const docs = await FlowSetting.find().lean();
  const byKey = {};
  docs.forEach((d) => (byKey[d.key] = d));
  // Merge defaults so the admin always sees every configurable field.
  const data = Object.entries(DEFAULTS).map(([key, def]) => ({
    key,
    label: def.label,
    type: def.type,
    value: byKey[key]?.value ?? def.value
  }));
  res.json({ success: true, data });
});

router.put('/settings/:key', upload.single('image'), async (req, res) => {
  try {
    const { key } = req.params;
    const def = DEFAULTS[key];
    if (!def) return res.status(400).json({ success: false, message: 'Unknown setting key' });
    let value = req.body.value;
    if (def.type === 'image' && req.file) {
      value = await cloudinaryService.uploadBuffer(req.file.buffer, 'kapso/flow');
    }
    const doc = await FlowSetting.findOneAndUpdate(
      { key },
      { $set: { key, label: def.label, type: def.type, value: value ?? '' } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Demo leads ----------------
router.get('/demos', async (_req, res) => {
  const demos = await DemoLead.find().sort({ createdAt: -1 });
  res.json({ success: true, data: demos });
});

router.get('/demos/:id', async (req, res) => {
  const demo = await DemoLead.findById(req.params.id);
  if (!demo) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: demo });
});

router.patch('/demos/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['New', 'Contacted', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const demo = await DemoLead.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!demo) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: demo });
});

router.delete('/demos/:id', async (req, res) => {
  const demo = await DemoLead.findByIdAndDelete(req.params.id);
  if (!demo) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});

router.get('/stats', async (_req, res) => {
  const [totalDemos, newDemos, totalCategories] = await Promise.all([
    DemoLead.countDocuments(),
    DemoLead.countDocuments({ status: 'New' }),
    Category.countDocuments()
  ]);
  res.json({ success: true, stats: { totalDemos, newDemos, totalCategories } });
});

export default router;
