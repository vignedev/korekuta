import SQLite from 'better-sqlite3'
import { Database, DataEntry } from './database.js';

export class SQLiteDatabase extends Database {
  private sqlite: SQLite.Database

  private getAllEntriesStatement: SQLite.Statement<[], { name: string }>
  private getEntriesStatement: SQLite.Statement<[name: string, from: number, to: number], DataEntry>
  private pushEntryStatement: SQLite.Statement<[name: string, timestamp: number, value: number], void>
  private trimEntriesStatement: SQLite.Statement<[name: string, threshold: number], void>
  private trimAllEntriesStatement: SQLite.Statement<[threshold: number], void>
  private deleteEntriesStatement: SQLite.Statement<[name: string], void>

  constructor(path: string) {
    super()
    
    this.sqlite = new SQLite(path)
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,

        entry_name TEXT NOT NULL,
        entry_timestamp INTEGER NOT NULL,
        entry_value REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS entries_by_name
        ON entries (entry_name);
      CREATE INDEX IF NOT EXISTS entries_by_name_timestamp
        ON entries (entry_name, entry_timestamp);
    `)

    this.getAllEntriesStatement = this.sqlite.prepare(`
      SELECT DISTINCT entry_name AS name FROM entries
    `)
    this.getEntriesStatement = this.sqlite.prepare(`
      SELECT entry_timestamp AS timestamp, entry_value AS value FROM entries WHERE
        entry_name = ? AND
        entry_timestamp >= ? AND
        entry_timestamp <= ?
    `)
    this.pushEntryStatement = this.sqlite.prepare(`
      INSERT INTO entries (entry_name, entry_timestamp, entry_value) VALUES (?, ?, ?)
    `)
    this.trimEntriesStatement = this.sqlite.prepare(`
      DELETE FROM entries WHERE entry_name = ? AND entry_timestamp <= ?
    `)
    this.trimAllEntriesStatement = this.sqlite.prepare(`
      DELETE FROM entries WHERE entry_timestamp <= ?
    `)
    this.deleteEntriesStatement = this.sqlite.prepare(`
      DELETE FROM entries WHERE entry_name = ?
    `)
  }

  async getAllEntries(): Promise<string[]> {
    return this.getAllEntriesStatement.all().map(x => x.name)
  }

  async getEntries(name: string, fromTimestamp: number, toTimestamp: number): Promise<DataEntry[]> {
    return this.getEntriesStatement.all(name, fromTimestamp, toTimestamp)
  }
  async pushEntry(name: string, value: number): Promise<void> {
    this.pushEntryStatement.run(name, Date.now(), value)
  }
  async trimEntries(name: string, timestampThreshold: number): Promise<void> {
    this.trimEntriesStatement.run(name, timestampThreshold)
  }
  async trimAllEntries(timestampThreshold: number): Promise<void> {
    this.trimAllEntriesStatement.run(timestampThreshold)
  }
  async deleteEntries(name: string): Promise<void> {
    this.deleteEntriesStatement.run(name)
  }
}