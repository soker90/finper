import { CustomError, HttpError } from '../types/errors'

export default (title: string) => {
  function logInfo (message: string, labels?: Record<string, unknown>): void {
    const params: Record<string, unknown> = { message: `${title} - ${message}` }
    /* istanbul ignore next — optional labels param not used in current API calls */
    if (labels) { params.labels = labels }
    console.info(params)
  }

  function logError (message: string, error?: HttpError | CustomError | Error): void {
    const params: Record<string, unknown> = { message: `${title} - ${message}` }
    /* istanbul ignore next — optional error param not used in all logError call sites */
    if (error) { params.error = error }
    console.error(params)
  }

  return { logInfo, logError }
}
