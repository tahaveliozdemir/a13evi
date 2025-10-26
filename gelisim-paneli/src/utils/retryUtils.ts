/**
 * Retry utility for handling transient failures in Firebase operations
 * Uses exponential backoff strategy
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'unknown',
    'network-request-failed',
    'NETWORK_ERROR',
  ],
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateDelay(
  attemptNumber: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorCode = error.code || error.message || '';
  const errorString = errorCode.toString().toLowerCase();

  return retryableErrors.some((retryableCode) =>
    errorString.includes(retryableCode.toLowerCase())
  );
}

/**
 * Retry a promise-returning function with exponential backoff
 *
 * @param fn - Function to retry (must return a Promise)
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function's result
 *
 * @example
 * ```typescript
 * const data = await retryAsync(
 *   () => getDoc(docRef),
 *   { maxAttempts: 5, initialDelay: 500 }
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Success - log if it was a retry
      if (attempt > 1) {
        console.log(
          `[Retry] Success on attempt ${attempt}/${opts.maxAttempts}`
        );
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const shouldRetry =
        attempt < opts.maxAttempts &&
        isRetryableError(error, opts.retryableErrors);

      if (!shouldRetry) {
        // Don't retry - either max attempts reached or non-retryable error
        if (attempt === opts.maxAttempts) {
          console.error(
            `[Retry] Max attempts (${opts.maxAttempts}) reached. Giving up.`,
            error
          );
        } else {
          console.error('[Retry] Non-retryable error encountered:', error);
        }
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      console.warn(
        `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed. ` +
          `Retrying in ${delay}ms...`,
        error.code || error.message
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with custom error handler
 *
 * @example
 * ```typescript
 * await retryWithHandler(
 *   () => saveChildren(data),
 *   (error, attempt) => {
 *     console.log(`Attempt ${attempt} failed:`, error);
 *     return true; // continue retrying
 *   }
 * );
 * ```
 */
export async function retryWithHandler<T>(
  fn: () => Promise<T>,
  errorHandler: (error: any, attempt: number) => boolean | Promise<boolean>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Ask error handler if we should continue
      const shouldContinue = await errorHandler(error, attempt);
      if (!shouldContinue) {
        throw error;
      }

      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of a function
 *
 * @example
 * ```typescript
 * const retryableGetChildren = withRetry(getChildren, { maxAttempts: 5 });
 * const children = await retryableGetChildren();
 * ```
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
): (...args: T) => Promise<R> {
  return (...args: T) => retryAsync(() => fn(...args), options);
}
