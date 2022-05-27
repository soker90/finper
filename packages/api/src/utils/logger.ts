import { CustomError, HttpError } from '../types/errors';

export default (title: string) => {
  function logInfo(message: string, labels?: Record<string, unknown>): void {
    const params: Record<string, unknown> = { message: `${title} - ${message}` };
    if (labels) { params.labels = labels; }
    console.info(params);
  }

  function logError(message: string, error?: HttpError|CustomError|Error): void {
    const params: Record<string, unknown> = { message: `${title} - ${message}` };
    if (error) { params.error = error; }
    console.error(params);
  }

  return { logInfo, logError };
};
