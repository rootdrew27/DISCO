import { Logger } from "./logger.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TokenCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenCreationError';
  }
}

export class ErrorHandler {
  constructor(private logger: Logger) {}
  
  handleValidationError(error: ValidationError): void {
    this.logger.error('Validation error:', error.message);
  }
  
  handleTokenCreationError(error: TokenCreationError): void {
    this.logger.error('Token creation error:', error.message);
  }
  
  handleGenericError(error: Error, context: string): void {
    this.logger.error(`Error in ${context}:`, error.message);
  }
}