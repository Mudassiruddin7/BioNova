/**
 * Standard API response format
 */
class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;

  /**
   * Create a standardized API response
   * @param statusCode HTTP status code
   * @param data Response data
   * @param message Response message
   */
  constructor(statusCode: number, data: any, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse; 