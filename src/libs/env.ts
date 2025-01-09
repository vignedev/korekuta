/**
 * Checks if the environment variable `key` is enabled.
 * Enabled in this case is everything that is not:
 * - env. variable is missing
 * - 0
 * - false
 * - no
 * @param key Name of the environment variable
 * @param defaultValue Default value to be returned if it is not provided
 */
export const envEnabled = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key]
  if(typeof value == 'undefined') return defaultValue ?? false
  
  const str = value.toString().toLowerCase()
  if(str === '' || str === '0' || str == 'false' || str == 'no') return false

  return true
}

/**
 * Will attempt to read environment variable `key`, and will throw
 * an exception if it is not provided unless a `defaultValue` is provided.
 * If the value is parsed to be NaN, it will also throw.
 * @param key Name of the environment variable
 * @param defaultValue Default value if missing
 * @returns Parsed value
 */
export const envInt = (key: string, defaultValue?: number): number => {
  const value = process.env[key]
  if(typeof value == 'undefined')
    if(typeof defaultValue != 'undefined') return defaultValue
    else throw Error(`Environment variable ${key} is unset`)

  const int = parseInt(value, 10)
  if(isNaN(int)) throw Error(`Environment variable ${key} cannot be parsed as an integer`)

  return int
}

export const envString = (key: string, defaultValue?: string): string => {
  const value = process.env[key]
  if(typeof value == 'undefined')
    if(typeof defaultValue != 'undefined') return defaultValue
    else throw Error(`Environment variable ${key} is unset`)

  return value
}