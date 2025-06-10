import express from 'express';
import { verifyJWT } from '../../middleware/auth';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { labIoTService } from '../../services/labIoTService';

const router = express.Router();

/**
 * Get latest sensor data
 */
router.get('/sensor-data', asyncHandler(async (req, res) => {
  const result = await labIoTService.getLatestSensorData();
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      message: result.message || 'Failed to get sensor data'
    });
  }
  
  return res.status(200).json(
    new ApiResponse(
      200,
      result.data,
      'Sensor data retrieved successfully'
    )
  );
}));

/**
 * Process sensor data
 */
router.post('/process-sensor-data', verifyJWT, asyncHandler(async (req, res) => {
  const { sensorData, options } = req.body;
  
  if (!sensorData) {
    return res.status(400).json({
      success: false,
      message: 'Sensor data is required'
    });
  }
  
  const result = await labIoTService.processSensorData(sensorData, options);
  
  return res.status(result.success ? 200 : 500).json(
    new ApiResponse(
      result.success ? 200 : 500,
      result,
      result.success ? 'Sensor data processed successfully' : 'Failed to process sensor data'
    )
  );
}));

/**
 * Generate alerts
 */
router.post('/generate-alerts', verifyJWT, asyncHandler(async (req, res) => {
  const { sensorData, options } = req.body;
  
  if (!sensorData) {
    return res.status(400).json({
      success: false,
      message: 'Sensor data is required'
    });
  }
  
  const result = await labIoTService.generateAlert(sensorData, options);
  
  return res.status(result.success ? 200 : 500).json(
    new ApiResponse(
      result.success ? 200 : 500,
      result,
      result.success ? 'Alerts generated successfully' : 'Failed to generate alerts'
    )
  );
}));

export default router; 