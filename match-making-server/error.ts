import { Logger } from "./logger.js";

export class ErrorHandler {
  constructor(private logger: Logger) {}

  handleSocketError(error: Error, context: string): void {
    this.logger.error(`Socket error in ${context}:`, error.message);
  }

  handleMatchError(error: Error, matchId: string): void {
    this.logger.error(`Match error for ${matchId}:`, error.message);
  }

  handleAuthError(error: Error): void {
    this.logger.error("Authentication error:", error.message);
  }

  handleGeneralError(error: Error, context: string): void {
    this.logger.error(`General error in ${context}:`, error.message);
  }
}
