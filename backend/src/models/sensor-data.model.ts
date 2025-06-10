import mongoose, { Document, Schema } from "mongoose";

// Sensor reading interface
export interface ISensorReading {
  value: number;
  timestamp: Date;
}

// Sensor data document interface
export interface ISensorData extends Document {
  temperature: ISensorReading[];
  humidity: ISensorReading[];
  pressure?: ISensorReading[];
  light?: ISensorReading[];
  co2?: ISensorReading[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sensor reading schema
const sensorReadingSchema = new Schema<ISensorReading>(
  {
    value: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Sensor data schema
const sensorDataSchema = new Schema<ISensorData>(
  {
    temperature: {
      type: [sensorReadingSchema],
      default: [],
    },
    humidity: {
      type: [sensorReadingSchema],
      default: [],
    },
    pressure: {
      type: [sensorReadingSchema],
      default: [],
    },
    light: {
      type: [sensorReadingSchema],
      default: [],
    },
    co2: {
      type: [sensorReadingSchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Function to add a new reading and maintain only the last N readings
export const addSensorReading = (
  sensor: ISensorData,
  type: keyof Omit<ISensorData, "_id" | "lastUpdated" | "createdAt" | "updatedAt">,
  value: number,
  maxReadings = 100
) => {
  if (!sensor[type]) {
    // @ts-ignore
    sensor[type] = [];
  }

  // Add new reading
  // @ts-ignore
  sensor[type].push({ value, timestamp: new Date() });

  // Trim array to keep only the latest readings
  // @ts-ignore
  if (sensor[type].length > maxReadings) {
    // @ts-ignore
    sensor[type] = sensor[type].slice(-maxReadings);
  }

  // Update lastUpdated timestamp
  sensor.lastUpdated = new Date();
};

// Create and export SensorData model
const SensorData = mongoose.model<ISensorData>("SensorData", sensorDataSchema);
export default SensorData; 