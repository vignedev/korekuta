import { SQLiteDatabase } from 'libs/SQLiteDatabase'
import { buffer } from 'node:stream/consumers'
import { pipeline } from 'node:stream/promises'
import restana from 'restana'

const server = restana()
const database = new SQLiteDatabase('./database.db')

setInterval(async () => {
  console.log(`${new Date().toISOString()} | trimming old stuff`)
  await database.trimAllEntries(Date.now() - 604_800_000)
}, 3_600_000)

server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`)
  return next()
})

server
.get('/api/entries', async (req, res) => {
  res.send(await database.getAllEntries(), 200)
})
.get('/api/entries/:name', async (req, res) => {
  const { name } = req.params
  const { from, to } = req.query

  if(Array.isArray(from) || Array.isArray(to))
    throw new Error('Multiple ?from or ?to specified.')

  if(isNaN(+from) || (to && isNaN(+to)))
    throw new Error('Invalid ?from or ?to -- isNaN?')

  res.send(await database.getEntries(name, +from, +to || (Date.now() + 10)))
})
.post('/api/entries/:name', async (req, res) => {
  const { name } = req.params
  const value = (await buffer(req)).toString()
  if(!value)
    throw new Error('Empty value')

  if(isNaN(+value))
    throw new Error('Value is parsed as NaN')

  const timestamp = new Date()
  await database.pushEntry(name, +value)

  res.send({ timestamp, value }, 200)
})
.delete('/api/entries/:name', async (req, res) => {
  const { name } = req.params
  await database.deleteEntries(name)
  
  res.send({}, 200)
})

server.start(8888)