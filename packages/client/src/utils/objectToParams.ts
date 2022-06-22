export const objectToParams = (obj: any) => (
  '?' + new URLSearchParams(obj).toString().replace(/\w+=&/g, '').replace(/&\w+=$/g, '')
)
