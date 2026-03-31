import dayjs from 'dayjs'

export const dateToInput = (ts: number): string => dayjs(ts).format('YYYY-MM-DD')
export const inputToTimestamp = (str: string): number => dayjs(str).startOf('day').valueOf()
