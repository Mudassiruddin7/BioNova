import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import SensorData, { addSensorReading, ISensorData } from '../models/sensor-data.model';
import logger from '../utils/logger';
import config from '../config';
import { synapseCore } from './synapse/synapseCore.service';

let io: Server;
let sensorDataDocument: ISensorData | null = null;

// Store connected clients here
const connectedClients = new Set<string>();

/**
 * Setup lab-specific Socket.IO event handlers
 */
const setupLabSocketHandlers = (socketIO: Server) => {
  // Handle connection
  socketIO.on('connection', (socket) => {
    logger.info(`Client connected to lab service: ${socket.id}`);
    connectedClients.add(socket.id);

    // Send initial data
    if (sensorDataDocument) {
      socket.emit('initial-data', {
        temperature: sensorDataDocument.temperature.slice(-20),
        humidity: sensorDataDocument.humidity.slice(-20),
        pressure: sensorDataDocument.pressure?.slice(-20),
        light: sensorDataDocument.light?.slice(-20),
        co2: sensorDataDocument.co2?.slice(-20),
      });
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected from lab service: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });
};

/**
 * Unified Lab IoT Service
 * Combines functionality from Lab Monitor and IoT services
 */
class LabIoTService {
  readonly ALERT_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    URGENT: 'urgent',
    CRITICAL: 'critical'
  };

  readonly DEFAULT_THRESHOLDS = {
    temperature: {
      min: 18, max: 27,
      warningDeviation: 10, // percent
      urgentDeviation: 20,
      criticalDeviation: 30
    },
    humidity: {
      min: 35, max: 65,
      warningDeviation: 15,
      urgentDeviation: 25,
      criticalDeviation: 40
    },
    co2: {
      min: 350, max: 1500,
      warningDeviation: 20,
      urgentDeviation: 50,
      criticalDeviation: 100
    },
    pressure: {
      min: 980, max: 1030,
      warningDeviation: 2,
      urgentDeviation: 3,
      criticalDeviation: 5
    },
    oxygen: {
      min: 19.5, max: 23.5,
      warningDeviation: 5,
      urgentDeviation: 10,
      criticalDeviation: 15
    },
    particulates: {
      min: 0, max: 50,
      warningDeviation: 30,
      urgentDeviation: 80,
      criticalDeviation: 150
    }
  };

  /**
   * Get Socket.IO server instance
   * @returns Socket.IO server instance or undefined if not initialized
   */
  getIO(): Server | undefined {
    return io;
  }

  /**
   * Initialize Socket.IO server
   * @param server HTTP server instance
   * @deprecated Use setSocketIOInstance instead to avoid duplicate Socket.IO initialization
   */
  initializeSocketIO(server: http.Server) {
    logger.warn('initializeSocketIO is deprecated, use setSocketIOInstance instead');
    
    // Create Socket.IO server only if it doesn't exist yet
    if (!io) {
    // Create Socket.IO server
    io = new Server(server, {
      cors: {
        origin: config.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

      // Set up event handlers
      setupLabSocketHandlers(io);

    logger.info('Socket.IO initialized');
    } else {
      logger.warn('Socket.IO already initialized, using existing instance');
    }

    // Start simulating sensor data
    this.initializeSensorData();
  }

  /**
   * Initialize sensor data (create or load from database)
   */
  async initializeSensorData() {
    try {
      // Find or create sensor data document
      let sensorData = await SensorData.findOne();
      
      if (!sensorData) {
        sensorData = await SensorData.create({});
        logger.info('Created new sensor data document');
      }
      
      sensorDataDocument = sensorData;
      
      // Start simulation
      this.startSensorSimulation();
    } catch (error) {
      logger.error('Error initializing sensor data:', error);
    }
  }

  /**
   * Start simulating sensor data
   */
  startSensorSimulation() {
    // Generate data every 5 seconds
    setInterval(async () => {
      if (!sensorDataDocument || connectedClients.size === 0) return;
      
      try {
        // Get current values (or default if none exist)
        const currentTemp = sensorDataDocument.temperature.length > 0 
          ? sensorDataDocument.temperature[sensorDataDocument.temperature.length - 1].value 
          : 22;
        
        const currentHumidity = sensorDataDocument.humidity.length > 0 
          ? sensorDataDocument.humidity[sensorDataDocument.humidity.length - 1].value 
          : 45;

        // Simulate new values with small random changes
        const newTemp = Number((currentTemp + (Math.random() * 0.4 - 0.2)).toFixed(1));
        const newHumidity = Number((currentHumidity + (Math.random() * 2 - 1)).toFixed(1));
        
        // Add readings to document
        addSensorReading(sensorDataDocument, 'temperature', newTemp);
        addSensorReading(sensorDataDocument, 'humidity', newHumidity);
        
        // Save to database
        await sensorDataDocument.save();
        
        // Broadcast to connected clients
        const dataToSend = {
          temperature: { value: newTemp, timestamp: new Date() },
          humidity: { value: newHumidity, timestamp: new Date() },
        };
        
        io.emit('sensor-data', dataToSend);
        
        // Process sensor data for alerts
        const sensorData = {
          labId: 'main-lab',
          timestamp: new Date(),
          sensors: [
            {
              id: 'temp-sensor-1',
              type: 'temperature',
              value: newTemp,
              unit: 'celsius'
            },
            {
              id: 'humidity-sensor-1',
              type: 'humidity',
              value: newHumidity,
              unit: 'percent'
            }
          ]
        };

        // Check for alerts
        const alerts = await this.generateAlert(sensorData);
        
        // If there are alerts, emit them via socket
        if (alerts.alerts && alerts.alerts.length > 0) {
          io.emit('sensor-alert', {
            alerts: alerts.alerts,
            analysis: alerts.aiAnalysis,
            timestamp: new Date(),
          });
        }
        
        // Occasionally generate insights with AI
        if (Math.random() < 0.1) { // 10% chance each update
          const insights = await this.generateSensorInsights(newTemp, newHumidity);
          if (insights.success) {
            io.emit('sensor-insights', {
              message: insights.message,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        logger.error('Error in sensor simulation:', error);
      }
    }, 5000);
    
    logger.info('Sensor simulation started');
  }

  /**
   * Get latest sensor data
   */
  async getLatestSensorData() {
    try {
      if (!sensorDataDocument) {
        // Try to get from database
        sensorDataDocument = await SensorData.findOne();
        
        if (!sensorDataDocument) {
          return {
            success: false,
            message: 'No sensor data available',
          };
        }
      }
      
      return {
        success: true,
        data: {
          temperature: sensorDataDocument.temperature.slice(-20),
          humidity: sensorDataDocument.humidity.slice(-20),
          pressure: sensorDataDocument.pressure?.slice(-20),
          light: sensorDataDocument.light?.slice(-20),
          co2: sensorDataDocument.co2?.slice(-20),
          lastUpdated: sensorDataDocument.lastUpdated,
        },
      };
    } catch (error) {
      logger.error('Error getting latest sensor data:', error);
      return {
        success: false,
        message: 'Failed to get sensor data',
      };
    }
  }

  /**
   * Generate insights about sensor data
   */
  async generateSensorInsights(temperature: number, humidity: number) {
    try {
      // Use synapseService to generate insights
      const prompt = `
        Analyze the following laboratory sensor readings:
        
        Temperature: ${temperature}°C
        Humidity: ${humidity}%
        
        Provide a brief, helpful insight about these readings and their implications for laboratory conditions.
        Keep your analysis concise (1-2 sentences) and focus on actionable insights.
      `;
      
      const result = await synapseCore.generateText(
        prompt,
        'You are a lab monitoring assistant analyzing sensor data. Provide concise, accurate insights about laboratory conditions.',
        undefined,
        'system'
      );
      
      return {
        success: true,
        message: result.data || 'Unable to generate insights',
      };
    } catch (error) {
      logger.error('Error generating sensor insights:', error);
      return {
        success: false,
        message: 'Failed to generate insights',
      };
    }
  }

  /**
   * Process sensor readings from lab equipment
   * @param sensorData The sensor readings from lab equipment
   * @param options Processing options
   * @returns Processed sensor data with analysis
   */
  async processSensorData(
    sensorData: any,
    options: {
      includeAnalysis?: boolean;
      includeRecommendations?: boolean;
    } = { includeAnalysis: true, includeRecommendations: false }
  ) {
    try {
      logger.info('Processing lab sensor data', {
        sensorCount: sensorData?.sensors?.length || 0,
        includeAnalysis: options.includeAnalysis,
        includeRecommendations: options.includeRecommendations
      });

      // Validate sensor data
      if (!sensorData || !sensorData.sensors || !Array.isArray(sensorData.sensors)) {
        throw new Error('Invalid sensor data format');
      }

      // Process sensor readings
      const processedData = {
        timestamp: new Date().toISOString(),
        labId: sensorData.labId || 'unknown',
        processed: sensorData.sensors.map((sensor: any) => ({
          sensorId: sensor.id,
          type: sensor.type,
          value: sensor.value,
          unit: sensor.unit,
          status: this.determineSensorStatus(sensor),
          range: this.getSensorRange(sensor.type),
        }))
      };

      // Generate AI analysis if requested
      let analysis = null;
      if (options.includeAnalysis) {
        analysis = await this.generateAnalysis(processedData);
      }

      // Generate recommendations if requested
      let recommendations = null;
      if (options.includeRecommendations) {
        recommendations = await this.generateRecommendations(processedData);
      }

      return {
        success: true,
        data: processedData,
        analysis,
        recommendations,
      };
    } catch (error) {
      logger.error('Error processing lab sensor data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Determine sensor status based on reading
   * @param sensor The sensor data
   * @returns Status string (normal, warning, critical)
   */
  private determineSensorStatus(sensor: any): 'normal' | 'warning' | 'critical' {
    const { type, value } = sensor;
    
    // Get range for this sensor type
    const range = this.getSensorRange(type);
    
    if (value < range.critical.min || value > range.critical.max) {
      return 'critical';
    } else if (value < range.warning.min || value > range.warning.max) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  /**
   * Generate alert based on sensor data
   */
  async generateAlert(
    sensorData: any,
    options: {
      includeAIAnalysis?: boolean;
      customThresholds?: Record<string, any>;
    } = { includeAIAnalysis: true }
  ) {
    try {
      logger.info('Generating lab alerts based on sensor data', {
        sensorCount: sensorData?.sensors?.length || 0,
        includeAIAnalysis: options.includeAIAnalysis
      });
      
      // Validate sensor data
      if (!sensorData || !sensorData.sensors || !Array.isArray(sensorData.sensors)) {
        throw new Error('Invalid sensor data format');
      }

      // Use custom thresholds if provided
      const thresholds = options.customThresholds || this.DEFAULT_THRESHOLDS;
      
      // Array to collect alerts
      const alerts = [];
      
      // Process each sensor reading
      for (const sensor of sensorData.sensors) {
        // Get threshold for this sensor type
        const threshold = thresholds[sensor.type];
        
        if (!threshold) {
          logger.warn(`No threshold defined for sensor type: ${sensor.type}`, { 
            sensorId: sensor.id 
          });
          continue;
        }
        
        // Check if reading is out of range
        if (sensor.value < threshold.min || sensor.value > threshold.max) {
          // Calculate the deviation percentage
          const targetValue = sensor.value < threshold.min ? threshold.min : threshold.max;
          const deviation = Math.abs(sensor.value - targetValue);
          const deviationPercentage = (deviation / targetValue) * 100;
          
          // Determine severity level based on deviation
          const severity = this.determineSeverity(sensor.type, deviationPercentage, threshold);
          
          // Create alert object
          const alert = {
            id: this.generateAlertId(),
            timestamp: new Date().toISOString(),
            sensorId: sensor.id,
            sensorType: sensor.type,
            value: sensor.value,
            unit: sensor.unit || '',
            threshold: sensor.value < threshold.min ? threshold.min : threshold.max,
            deviation: deviation.toFixed(2),
            deviationPercentage: deviationPercentage.toFixed(2),
            severity,
            message: `${sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1)} ${
              sensor.value < threshold.min ? 'below' : 'above'
            } acceptable range (${sensor.value} ${sensor.unit || ''})`,
            status: 'active',
            labId: sensorData.labId || 'unknown'
          };
          
          alerts.push(alert);
        }
      }
      
      // Generate AI analysis if requested and there are alerts
      let aiAnalysis = null;
      if (options.includeAIAnalysis && alerts.length > 0) {
        // Context data about the lab and sensors
        const contextData = {
          labId: sensorData.labId || 'unknown',
          timestamp: new Date().toISOString(),
          sensorCount: sensorData.sensors.length,
          alertCount: alerts.length,
          sensorTypes: sensorData.sensors.map((s: any) => s.type)
        };
        
        aiAnalysis = await this.generateAIAnalysis(alerts, contextData);
      }
      
      // Save alerts to database (simulated for hackathon)
      const alertIds = await this.saveAlerts(alerts);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        alerts,
        alertCount: alerts.length,
        aiAnalysis,
        alertIds
      };
      
    } catch (error: any) {
      logger.error('Error generating lab alerts', { error: error.message });
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        alerts: []
      };
    }
  }

  /**
   * Get standard range for a sensor type
   * @param sensorType The type of sensor
   * @returns Range object with normal, warning and critical thresholds
   */
  private getSensorRange(sensorType: string) {
    // Define standard ranges for different sensor types
    // In a real implementation, these might come from a database or configuration
    const ranges: Record<string, any> = {
      temperature: {
        unit: 'celsius',
        normal: { min: 20, max: 24 },
        warning: { min: 18, max: 26 },
        critical: { min: 15, max: 30 }
      },
      humidity: {
        unit: 'percent',
        normal: { min: 30, max: 60 },
        warning: { min: 20, max: 70 },
        critical: { min: 10, max: 80 }
      },
      pressure: {
        unit: 'mbar',
        normal: { min: 990, max: 1020 },
        warning: { min: 970, max: 1040 },
        critical: { min: 950, max: 1060 }
      },
      oxygen: {
        unit: 'percent',
        normal: { min: 19.5, max: 23 },
        warning: { min: 18, max: 25 },
        critical: { min: 16, max: 28 }
      },
      co2: {
        unit: 'ppm',
        normal: { min: 300, max: 1000 },
        warning: { min: 200, max: 2000 },
        critical: { min: 100, max: 5000 }
      },
      airflow: {
        unit: 'm/s',
        normal: { min: 0.2, max: 0.8 },
        warning: { min: 0.1, max: 1.0 },
        critical: { min: 0, max: 1.5 }
      }
    };
    
    // Return range for requested sensor type, or a generic range if not found
    return ranges[sensorType] || {
      unit: 'unknown',
      normal: { min: 0, max: 100 },
      warning: { min: -10, max: 110 },
      critical: { min: -20, max: 120 }
    };
  }

  /**
   * Generate AI analysis of alerts
   */
  private async generateAIAnalysis(alerts: any[], contextData: any) {
    try {
      // Construct the prompt for the AI
      const alertSummary = alerts
        .map(a => `${a.sensorType}: ${a.value}${a.unit} (${a.severity}, ${a.deviationPercentage}% deviation)`)
        .join('\n');
      
      const prompt = `
        Analyze the following laboratory alerts:
        
        Lab ID: ${contextData.labId}
        Timestamp: ${contextData.timestamp}
        
        Alerts:
        ${alertSummary}
        
        Provide a brief analysis focusing on:
        1. The potential causes of these alerts
        2. The likely impact on laboratory operations or experiments
        3. Recommended actions to address the issues
        
        Keep your analysis concise and focused on actionable insights.
      `;
      
      // Call the AI service
      const result = await synapseCore.generateText(
        prompt,
        'You are a laboratory monitoring expert analyzing sensor alerts. Provide concise, accurate analysis of lab conditions and clear recommendations.',
        undefined,
        'system'
      );
      
      return result.data || 'Unable to generate AI analysis';
    } catch (error) {
      logger.error('Error generating AI analysis for alerts:', error);
      return 'Error generating analysis';
    }
  }

  /**
   * Generate AI analysis of sensor data
   */
  private async generateAnalysis(processedData: any) {
    try {
      // Construct the prompt for the AI
      const sensorSummary = processedData.processed
        .map((s: any) => `${s.type}: ${s.value}${s.unit} (${s.status})`)
        .join('\n');
      
      const prompt = `
        Analyze the following laboratory sensor readings:
        
        Lab ID: ${processedData.labId}
        Timestamp: ${processedData.timestamp}
        
        Sensor readings:
        ${sensorSummary}
        
        Provide a brief analysis of these readings, including:
        1. Overall lab environment status
        2. Any potential issues or anomalies
        3. Correlations between different sensor readings
        
        Keep your analysis concise and focus on actionable insights.
      `;
      
      // Call the AI service
      const result = await synapseCore.generateText(
        prompt,
        'You are a laboratory monitoring expert analyzing sensor data. Provide concise, accurate analysis of lab conditions.',
        undefined,
        'system'
      );
      
      return result.data || 'Unable to generate analysis';
    } catch (error) {
      logger.error('Error generating analysis for sensor data:', error);
      return 'Error generating analysis';
    }
  }

  /**
   * Generate AI recommendations based on sensor data
   */
  private async generateRecommendations(processedData: any) {
    try {
      // Count sensors by status
      const statusCounts = {
        normal: 0,
        warning: 0,
        critical: 0
      };
      
      processedData.processed.forEach((sensor: any) => {
        statusCounts[sensor.status]++;
      });
      
      // Construct the prompt for the AI
      const sensorSummary = processedData.processed
        .map((s: any) => `${s.type}: ${s.value}${s.unit} (${s.status})`)
        .join('\n');
      
      // Adjust prompt based on status
      let promptFocus = '';
      if (statusCounts.critical > 0) {
        promptFocus = 'focusing primarily on addressing the CRITICAL issues immediately';
      } else if (statusCounts.warning > 0) {
        promptFocus = 'addressing the WARNING level issues before they become critical';
      } else {
        promptFocus = 'maintaining optimal conditions and preventing any future issues';
      }
      
      const prompt = `
        Generate recommendations for the following laboratory sensor readings:
        
        Lab ID: ${processedData.labId}
        Timestamp: ${processedData.timestamp}
        
        Sensor readings:
        ${sensorSummary}
        
        Provide 3-5 specific, actionable recommendations ${promptFocus}.
        For each recommendation, include:
        1. The specific action to take
        2. The priority (High/Medium/Low)
        3. The expected outcome
        
        Format each recommendation as a bulleted list and keep them concise.
      `;
      
      // Call the AI service
      const result = await synapseCore.generateText(
        prompt,
        'You are a laboratory safety expert providing recommendations based on sensor data. Give practical, specific advice for lab technicians to follow.',
        undefined,
        'system'
      );
      
      return result.data || 'Unable to generate recommendations';
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return 'Error generating recommendations';
    }
  }

  /**
   * Determine alert severity based on deviation
   */
  private determineSeverity(sensorType: string, deviationPercent: number, threshold: any) {
    // Get the threshold values for this sensor type
    const { warningDeviation, urgentDeviation, criticalDeviation } = threshold;
    
    if (deviationPercent >= criticalDeviation) {
      return this.ALERT_LEVELS.CRITICAL;
    } else if (deviationPercent >= urgentDeviation) {
      return this.ALERT_LEVELS.URGENT;
    } else if (deviationPercent >= warningDeviation) {
      return this.ALERT_LEVELS.WARNING;
    } else {
      return this.ALERT_LEVELS.INFO;
    }
  }

  /**
   * Generate a unique alert ID
   */
  private generateAlertId() {
    return 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Save alerts to database (simulated)
   */
  private async saveAlerts(alerts: any[]) {
    // This would typically save to a database
    // For the hackathon demo, we'll simulate this
    const alertIds = alerts.map(a => a.id);
    
    logger.info(`Saved ${alerts.length} alerts`, { 
      alertIds,
      severities: alerts.map(a => a.severity)
    });
    
    return alertIds;
  }
}

// Create singleton instance
export const labIoTService = new LabIoTService();

// Export functions that were previously exported from iot.service.ts
export const getIO = () => labIoTService.getIO();
export const initializeSocketIO = (server: http.Server) => labIoTService.initializeSocketIO(server); 

/**
 * Get recent sensor readings from the lab
 */
export const getRecentSensorData = async (userId: string) => {
  // Mock implementation - in a real app, this would query IoT devices or a database
  return [
    {
      sensorType: 'Temperature',
      value: 22.4,
      unit: '°C',
      location: 'Lab Room A',
      timestamp: new Date(),
      status: 'normal',
      labId: 'lab-001'
    },
    {
      sensorType: 'Humidity',
      value: 45.2,
      unit: '%',
      location: 'Lab Room A',
      timestamp: new Date(),
      status: 'normal',
      labId: 'lab-001'
    },
    {
      sensorType: 'CO2',
      value: 420,
      unit: 'ppm',
      location: 'Lab Room B',
      timestamp: new Date(),
      status: 'normal',
      labId: 'lab-001'
    }
  ];
};

/**
 * Get recent alerts from lab monitoring systems
 */
export const getRecentAlerts = async (userId: string) => {
  // Mock implementation - in a real app, this would query an alerts database
  return [
    {
      alertType: 'Temperature',
      severity: 'medium',
      message: 'Temperature above normal range in Incubator 2',
      timestamp: new Date(),
      status: 'active',
      labId: 'lab-001'
    },
    {
      alertType: 'Equipment',
      severity: 'low',
      message: 'Centrifuge maintenance due in 5 days',
      timestamp: new Date(),
      status: 'pending',
      labId: 'lab-001'
    }
  ];
};

/**
 * Sets the Socket.IO instance from an external source
 * This prevents initializing multiple Socket.IO instances on the same server
 */
export const setSocketIOInstance = (socketInstance: Server) => {
  // Set the global io variable to the provided instance
  io = socketInstance;
  
  // Set up the lab-specific event handlers on the shared instance
  setupLabSocketHandlers(io);
  
  // Initialize sensor data
  labIoTService.initializeSensorData();
  
  logger.info('Lab IoT service using shared Socket.IO instance');
}; 