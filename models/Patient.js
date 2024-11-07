// models/Patient.js

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  admissionDate: { type: Date, required: true },
  condition: { type: String, default: 'Stable' },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  emergencyContactPhone: { type: String },
  medicalHistory: { type: String, default: 'N/A' },
  allergies: { type: String, default: 'N/A' },
  bloodType: { type: String, default: 'N/A' },
});

module.exports = mongoose.model('Patient', patientSchema);
