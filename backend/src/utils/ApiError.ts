/**
 * Custom error class for API errors with status code
 */
class ApiError extends Error {
  statusCode: number;
  errors: string[];
  data: null | Record<string, any>;
  success: boolean;
  
  /**
   * Create a new API error
   * @param statusCode HTTP status code
   * @param message Error message
   * @param errors Additional error details
   * @param stack Error stack
   */
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: string[] = [],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError; 