import { sessions, type SessionInfo } from "../session";
import path from "path";
import { repos } from "../storage/repos";

export enum LogLevel {
  INFO = "INFO",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  WARN = "WARN",
  LOG = "LOG",
}

export class Logger {
  private session: SessionInfo;
  private logsPath: string;
  private fileName: string;

  constructor(session: SessionInfo, fileName?: string) {
    this.session = session;
    const rootPath = sessions.getExecutionRoot(session.id);
    this.logsPath = path.join(rootPath, "logs");
    this.fileName = fileName || "agent.log";
  }

  /**
   * Write a log message to the log file.
   *
   * Uses fire-and-forget: the async repo append is dispatched but not
   * awaited so that the public logging methods stay synchronous.
   */
  private writeLog(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - [${level}] ${message}\n`;

    repos.logs.append(this.logsPath, this.fileName, logEntry).catch((error) => {
      console.error(`Failed to write to log file: ${error}`);
    });
  }

  /**
   * Log a general message
   */
  public log(message: string): void {
    this.writeLog(LogLevel.LOG, message);
  }

  /**
   * Log an info message
   */
  public info(message: string): void {
    this.writeLog(LogLevel.INFO, message);
  }

  /**
   * Log an error message
   */
  public error(message: string): void {
    this.writeLog(LogLevel.ERROR, message);
  }

  /**
   * Log a debug message
   */
  public debug(message: string): void {
    this.writeLog(LogLevel.DEBUG, message);
  }

  /**
   * Log a warning message
   */
  public warn(message: string): void {
    this.writeLog(LogLevel.WARN, message);
  }

  /**
   * Get the current log file path
   */
  public getLogFilePath(): string {
    return repos.logs.getPath(this.logsPath, this.fileName);
  }

  /**
   * Get the session associated with this logger
   */
  public getSession(): SessionInfo {
    return this.session;
  }
}
