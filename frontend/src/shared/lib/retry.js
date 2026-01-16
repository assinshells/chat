// frontend/src/shared/lib/retry.js

export async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = () => {},
  } = options;

  let lastError;
  let timeoutId;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        onRetry(attempt + 1, waitTime, error);

        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, waitTime);
        });
      }
    }
  }

  if (timeoutId) clearTimeout(timeoutId);
  throw lastError;
}
