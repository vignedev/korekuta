import { buffer } from 'node:stream/consumers'
import restana from 'restana'
import { error, info } from './libs/log'
import { SQLiteDatabase } from './libs/SQLiteDatabase'
import { envInt, envString } from './libs/env'

const config = {
  host: envString('KOREKUTA_HOST', '0.0.0.0'),
  port: envInt('KOREKUTA_PORT', 65001),
  trimRetention: envInt('KOREKUTA_TRIM_RETENTION', 604_800_000),
  trimInterval: envInt('KOREKUTA_TRIM_INTERVAL', 3_600_000),
  database: envString('KOREKUTA_DATABASE_PATH', ':memory:')
} as const

const server = restana({
  errorHandler: (err, req, res) => {
    error(err)
    res.setHeader('Content-Type', 'application/json')
    res.send(err, 500)
  }
})
const database = new SQLiteDatabase(config.database)

setInterval(async () => {
  info('trimming old stuff')
  await database.trimAllEntries(Date.now() - config.trimRetention)
}, config.trimInterval)

server.use((req, _res, next) => {
  info(`${req.method} ${req.url}`)
  return next()
})

server
  .get('/api/entries', async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(await database.getAllEntries(), 200)
  })
  .get('/api/entries/:name', async (req, res) => {
    const { name } = req.params
    const { from, to } = req.query

    if (Array.isArray(from) || Array.isArray(to))
      throw new Error('Multiple ?from or ?to specified.')

    if ((from && isNaN(+from)) || (to && isNaN(+to)))
      throw new Error('Invalid ?from or ?to -- isNaN?')

    res.setHeader('Content-Type', 'application/json')
    res.send(await database.getEntries(
      name,
      +from || (0),
      +to || (Date.now() + 10)
    ))
  })
  .post('/api/entries/:name', async (req, res) => {
    const { name } = req.params
    const value = (await buffer(req)).toString()
    if (!value)
      throw new Error('Empty value')

    if (isNaN(+value))
      throw new Error('Value is parsed as NaN')

    const timestamp = Date.now()
    await database.pushEntry(name, timestamp, +value)

    res.setHeader('Content-Type', 'application/json')
    res.send({ timestamp, value: +value }, 200)
  })
  .delete('/api/entries/:name', async (req, res) => {
    const { name } = req.params
    await database.deleteEntries(name)

    res.send(null, 200)
  })
  .get('/api/ranges/:name', async (req, res) => {
    const { name } = req.params

    res.setHeader('Content-Type', 'application/json')
    res.send(await database.getEntryRange(name), 200)
  })
  .put('/api/ranges/:name', async (req, res) => {
    const { name } = req.params
    const { min, max } = JSON.parse((await buffer(req)).toString()) as { min?: number | null, max?: number | null }

    await database.setEntryRange(
      name,
      (min == 0) ? 0 : (min || null),
      (max == 0) ? 0 : (max || null)
    )

    res.setHeader('Content-Type', 'application/json')
    res.send({ min, max }, 200)
  })
  .delete('/api/ranges/:name', async (req, res) => {
    const { name } = req.params

    res.setHeader('Content-Type', 'application/json')
    res.send(null, 200)
  })

server.start(config.port, config.host)
  .then(() => info(`Listening on http://${config.host}:${config.port}`))
  .catch(error)