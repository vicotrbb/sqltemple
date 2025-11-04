export enum ErrorLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  DATABASE = "database",
  AI = "ai",
  FILE = "file",
  NETWORK = "network",
  VALIDATION = "validation",
  SYSTEM = "system",
  UI = "ui",
}

export interface AppError {
  id: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
  userMessage?: string;
  autoHide?: boolean;
  duration?: number;
}

export interface ErrorServiceCallbacks {
  onError?: (error: AppError) => void;
  onErrorCleared?: (errorId: string) => void;
}

export class ErrorService {
  private callbacks: ErrorServiceCallbacks = {};
  private errors: Map<string, AppError> = new Map();

  setCallbacks(callbacks: ErrorServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createError(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    options?: {
      details?: string;
      context?: Record<string, any>;
      userMessage?: string;
      autoHide?: boolean;
      duration?: number;
    }
  ): AppError {
    return {
      id: this.generateId(),
      level,
      category,
      message,
      details: options?.details,
      timestamp: new Date(),
      context: options?.context,
      userMessage: options?.userMessage || this.getDefaultUserMessage(category),
      autoHide:
        options?.autoHide ??
        (level === ErrorLevel.INFO || level === ErrorLevel.WARNING),
      duration: options?.duration ?? this.getDefaultDuration(level),
    };
  }

  private getDefaultUserMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.DATABASE:
        return "Database operation failed";
      case ErrorCategory.AI:
        return "AI service unavailable";
      case ErrorCategory.FILE:
        return "File operation failed";
      case ErrorCategory.NETWORK:
        return "Network connection failed";
      case ErrorCategory.VALIDATION:
        return "Input validation failed";
      case ErrorCategory.SYSTEM:
        return "System error occurred";
      case ErrorCategory.UI:
        return "Interface error occurred";
      default:
        return "An unexpected error occurred";
    }
  }

  private getDefaultDuration(level: ErrorLevel): number {
    switch (level) {
      case ErrorLevel.INFO:
        return 3000;
      case ErrorLevel.WARNING:
        return 5000;
      case ErrorLevel.ERROR:
        return 8000;
      case ErrorLevel.CRITICAL:
        return 0; // Don't auto-hide critical errors
      default:
        return 5000;
    }
  }

  logError(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    options?: {
      details?: string;
      context?: Record<string, any>;
      userMessage?: string;
      autoHide?: boolean;
      duration?: number;
    }
  ): string {
    const error = this.createError(level, category, message, options);
    this.errors.set(error.id, error);

    // Console logging for development
    const consoleMessage = `[${category.toUpperCase()}] ${message}`;
    switch (level) {
      case ErrorLevel.INFO:
        console.log(consoleMessage, error.context);
        break;
      case ErrorLevel.WARNING:
        console.warn(consoleMessage, error.context);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        console.error(consoleMessage, error.context);
        break;
    }

    // Notify UI
    this.callbacks.onError?.(error);

    // Auto-hide if specified
    if (error.autoHide && error.duration! > 0) {
      setTimeout(() => {
        this.clearError(error.id);
      }, error.duration);
    }

    return error.id;
  }

  clearError(errorId: string): void {
    if (this.errors.has(errorId)) {
      this.errors.delete(errorId);
      this.callbacks.onErrorCleared?.(errorId);
    }
  }

  clearAllErrors(): void {
    const errorIds = Array.from(this.errors.keys());
    this.errors.clear();
    errorIds.forEach((id) => this.callbacks.onErrorCleared?.(id));
  }

  getError(errorId: string): AppError | undefined {
    return this.errors.get(errorId);
  }

  getAllErrors(): AppError[] {
    return Array.from(this.errors.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // Convenience methods for common error types
  logDatabaseError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(ErrorLevel.ERROR, ErrorCategory.DATABASE, message, {
      details,
      context,
      userMessage: "Database connection or query failed",
    });
  }

  logAIError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(ErrorLevel.ERROR, ErrorCategory.AI, message, {
      details,
      context,
      userMessage: "AI service is currently unavailable",
    });
  }

  logFileError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(ErrorLevel.ERROR, ErrorCategory.FILE, message, {
      details,
      context,
      userMessage: "File operation could not be completed",
    });
  }

  logValidationError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(
      ErrorLevel.WARNING,
      ErrorCategory.VALIDATION,
      message,
      {
        details,
        context,
        userMessage: "Please check your input and try again",
      }
    );
  }

  logInfo(
    message: string,
    userMessage?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(ErrorLevel.INFO, ErrorCategory.UI, message, {
      context,
      userMessage,
    });
  }

  logSuccess(
    message: string,
    userMessage?: string,
    context?: Record<string, any>
  ): string {
    return this.logError(ErrorLevel.INFO, ErrorCategory.UI, message, {
      context,
      userMessage,
      duration: 2000,
    });
  }
}

export const errorService = new ErrorService();
