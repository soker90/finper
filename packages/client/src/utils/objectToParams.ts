export const objectToParams = (obj: any) => (
  obj
    ? '?' + new URLSearchParams(obj).toString().replace(/\w+=&/g, '').replace(/&\w+=$/g, '')
    : ''
)
