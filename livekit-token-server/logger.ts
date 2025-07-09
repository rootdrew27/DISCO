
import fs from "fs";
import path from "path";
import { LogLevel } from "./types.js";

export class Logger {
  private logDir: string;
  private logLevel: LogLevel;

  constructor(logDir: string, logLevel: LogLevel) {
    this.logDir = logDir;
    this.logLevel = logLevel;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private writeToFile(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level}] ${message} ${data ? JSON.stringify(data) : ""}\n`;
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);

    fs.appendFileSync(logFile, logEntry);
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, data || "");
      this.writeToFile(LogLevel.ERROR, message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, data || "");
      this.writeToFile(LogLevel.WARN, message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, data || "");
      this.writeToFile(LogLevel.INFO, message, data);
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, data || "");
      this.writeToFile(LogLevel.DEBUG, message, data);
    }
  }
}
