// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Patient = require('./models/Patient');
const User = require('./models/user');
const bcrypt = require('bcrypt');
const Clinical = require('./models/Clinical');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Set up swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Patient Data REST API',
      version: '1.0.0',
      description: 'A REST API Service for a Patient Clinical Data management application for the health care providers in the hospital',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      schemas: {
        Patient: {
          type: 'object',
          properties: {
            patientId: { type: 'string' },
            name: { type: 'string' },
            age: { type: 'integer' },
            gender: { type: 'string' },
            admissionDate: { type: 'string', format: 'date' },
            condition: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            emergencyContactPhone: { type: 'string' },
            medicalHistory: { type: 'string' },
            allergies: { type: 'string' },
            bloodType: { type: 'string' },
          },
        },
        Clinical: {
          type: 'object',
          properties: {
            patient_id: { type: 'string' },
            type: { type: 'string' },
            value: { type: 'string' },
            dateTime: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Connect to patient_db
const patientDB = mongoose.createConnection('mongodb://localhost:27017/patient_db', {
  connectTimeoutMS: 20000,
});
const PatientModel = patientDB.model('Patient', Patient.schema);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     responses:
 *       200:
 *         description: List of all patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 */
app.get('/patients', async (req, res) => {
  try {
    const patients = await PatientModel.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get a single patient with clinical data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The patient ID
 *     responses:
 *       200:
 *         description: Patient data and clinical measurements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 */
app.get('/patients/:id', async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // TODO: Fetch all of this patient's clinical data
    
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Add a new patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Patient ID already exists
 */
app.post('/patients', async (req, res) => {
  // Get the values from body
  const {
    patientId,
    name,
    age,
    gender,
    admissionDate,
    condition,
    phone,
    email,
    address,
    emergencyContactPhone,
    medicalHistory,
    allergies,
    bloodType
  } = req.body;

  try {
    // Check if there is a duplicate patientId
    const existingPatient = await PatientModel.findOne({ patientId });

    if (existingPatient) {
      return res.status(400).json({ message: 'Patient ID already exists' });
    }

    // Create a Patient object
    const newPatient = new PatientModel({
      patientId,
      name,
      age,
      gender,
      admissionDate,
      condition,
      phone,
      email,
      address,
      emergencyContactPhone,
      medicalHistory,
      allergies,
      bloodType
    });

    // Store to database
    await newPatient.save();
    res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Connect to user_db
const userDB = mongoose.createConnection('mongodb://localhost:27017/user_db');
const UserModel = userDB.model('User', User.schema);

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Search user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Login successfully
    return res.json({ message: "Login successful", user: { email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Connect to user_db
const clinicalDB = mongoose.createConnection('mongodb://localhost:27017/clinical_db');
const ClinicalModel = clinicalDB.model('Clinical', Clinical.schema);

/**
 * @swagger
 * /clinical:
 *   post:
 *     summary: Add a new clinical measurement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Clinical'
 *     responses:
 *       201:
 *         description: Clinical measurement created successfully
 *       400:
 *         description: Error in creating clinical measurement
 */
app.post('/clinical', async (req, res) => {
  const newClinical = new ClinicalModel({
    ...req.body,
    dateTime: new Date()  // Use the current date and time
  });

  try {
    await newClinical.save();
    res.status(201).json(newClinical);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /clinical/{patientId}:
 *   get:
 *     summary: Get clinical measurements for a specific patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The patient ID
 *     responses:
 *       200:
 *         description: List of clinical measurements
 *       404:
 *         description: No clinical measurement found
 */
app.get('/clinical/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    // Search the specific patient's measurement data
    const clinicalData = await ClinicalModel.find({ patient_id: new mongoose.Types.ObjectId(patientId) });

    // Check if data exists
    if (clinicalData.length === 0) {
      return res.status(404).json({ message: "No clinical measurement found." });
    }

    res.status(200).json(clinicalData);
  } catch(error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
