/**
 * ErrorHandler.js
 * Centralized error parsing and human-readable message generation.
 */

export class AppError {
  constructor(message, actionableStep, canRetry = false, originalError = null) {
    this.message = message;
    this.actionableStep = actionableStep;
    this.canRetry = canRetry;
    this.originalError = originalError;
  }
}

export function translateError(error, responseStatus = null) {
  // 1. Check Offline State
  if (!navigator.onLine) {
    return new AppError(
      "You are offline. Check your connection.",
      "We will send your chat when you reconnect.",
      true
    );
  }

  // 2. Handle HTTP Status Codes (from fetch responses)
  if (responseStatus) {
    switch (responseStatus) {
      case 429:
        return new AppError(
          "You are sending messages too fast.",
          "Please wait a few seconds before trying again.",
          true
        );
      case 413:
        return new AppError(
          "This file is too large.",
          "Choose a file under 25MB and try again.",
          false
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(
          "Our servers are resting or unreachable.",
          "Your message is saved, and we will send it soon.",
          true
        );
      case 401:
      case 403:
        return new AppError(
          "You do not have permission to do this.",
          "Check your API keys or login status in settings.",
          false
        );
    }
  }

  // 3. Handle raw Error objects (e.g., Timeout, Failed to fetch)
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new AppError(
        "The request took too long to complete.",
        "The service might be busy. Click retry to attempt again.",
        true,
        error
      );
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return new AppError(
        "We couldn't reach the servers.",
        "Check your network connection and try again.",
        true,
        error
      );
    }
  }

  // 4. Default Fallback
  return new AppError(
    "Something went wrong while processing your request.",
    "Please try again in a few moments.",
    true,
    error
  );
}
