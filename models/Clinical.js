// models/Clinical.js

const mongoose = require('mongoose');

const clinicalSchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    type: { type: String, required: true },
    value: { type: String, required: true },
    dateTime: { type: Date, required: true },
  });

  module.exports = mongoose.model('Clinical', clinicalSchema);
