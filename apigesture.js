// backend/routes/gestureAPI.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Model and label mapping
let model;
const LABEL_MAP = {}; // Will be populated from dataset

// Load model and labels
async function loadModelAndLabels() {
  try {
    // Load model
    model = await tf.node.loadSavedModel(path.join(__dirname, '../models/dataset/hand_data'));
    
    // Load label mapping from dataset structure
    const datasetPath = path.join(__dirname, '../dataset/train');
    const classes = fs.readdirSync(datasetPath).filter(f => fs.statSync(path.join(datasetPath, f)).isDirectory());
    
    classes.forEach((className, index) => {
      LABEL_MAP[index] = className;
    });
    
    console.log(`Model loaded with ${classes.length} classes:`, classes);
  } catch (err) {
    console.error('Failed to load model:', err);
  }
}

loadModelAndLabels();

// Classification endpoint
router.post('/classify', upload.single('image'), async (req, res) => {
  if (!model) return res.status(503).json({ error: 'Model not ready' });
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  try {
    // Preprocess image
    const imageTensor = tf.node.decodeImage(req.file.buffer, 3);
    const resizedTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalizedTensor = resizedTensor.div(255.0);
    const batchedTensor = normalizedTensor.expandDims(0);

    // Predict
    const predictions = model.predict(batchedTensor);
    const predictedClass = predictions.argMax(1).dataSync()[0];
    const confidence = predictions.max().dataSync()[0];
    const gestureName = LABEL_MAP[predictedClass] || 'unknown';

    res.json({
      gesture: gestureName,
      confidence: confidence,
      classId: predictedClass
    });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ error: 'Classification failed' });
  }
});

// Dataset collection endpoint (now organized by train/test/val)
router.post('/dataset/:type', upload.single('image'), async (req, res) => {
  try {
    const { type } = req.params;
    const { label } = req.body;
    
    if (!['train', 'test', 'val'].includes(type)) {
      return res.status(400).json({ error: 'Invalid dataset type' });
    }
    if (!label) return res.status(400).json({ error: 'Label required' });

    const labelDir = path.join(__dirname, '../dataset', type, label);
    if (!fs.existsSync(labelDir)) fs.mkdirSync(labelDir, { recursive: true });

    const filename = `${Date.now()}.jpg`;
    fs.writeFileSync(path.join(labelDir, filename), req.file.buffer);

    res.json({ success: true, path: `${type}/${label}/${filename}` });
  } catch (error) {
    console.error('Dataset save error:', error);
    res.status(500).json({ error: 'Failed to save to dataset' });
  }
});

module.exports = router;