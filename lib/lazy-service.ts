export function createLazyService<T extends object>(factory: () => T): T {
  let instance: T | null = null

  const getInstance = () => {
    if (!instance) {
      instance = factory()
    }
    return instance
  }

  return new Proxy({} as T, {
    get(_target, prop) {
      const service = getInstance()
      const value = Reflect.get(service, prop, service)
      return typeof value === 'function' ? value.bind(service) : value
    },
    set(_target, prop, value) {
      const service = getInstance()
      return Reflect.set(service, prop, value, service)
    },
  })
}
