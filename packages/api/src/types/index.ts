/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Console {
      errorTrack: (...payload: any) => void;
  }
}

export type TaskParams = Record<string, string|number>;
