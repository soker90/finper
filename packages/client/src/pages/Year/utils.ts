export const isSameDate = (year?: string): boolean => {
    const now = new Date()
    return (year === now.getFullYear().toString())
}

export const getUrlYear = (year?: number): string => {
    return `/anual/${year || new Date().getFullYear()}`
}
