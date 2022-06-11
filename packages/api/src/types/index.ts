/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request } from 'express'

declare global {
    interface Console {
        errorTrack: (...payload: any) => void;
    }
}

export type TaskParams = Record<string, string | number>;

export interface RequestUser extends Request {
    user: string
}
