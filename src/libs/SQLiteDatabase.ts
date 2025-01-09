import SQLite from 'better-sqlite3'
import { Database, DataEntry, DataRange } from './database.js';

export class SQLiteDatabase extends Database {
  private sqlite: SQLite.Database

  private getAllEntriesStatement: SQLite.Statement<[], { name: string }>
  private getEntriesStatement: SQLite.Statement<[name: string, from: number, to: number], DataEntry>
  private pushEntryStatement: SQLite.Statement<[name: string, timestamp: number, value: number], void>
  private trimEntriesStatement: SQLite.Statement<[name: string, threshold: number], void>
  private trimAllEntriesStatement: SQLite.Statement<[threshold: number], void>
  private deleteEntriesStatement: SQLite.Statement<[name: string], void>
  private setEntryRangeStatement: SQLite.Statement<[name: string, min: number | null, max: number | null], DataRange>
  private getEntryRangeStatement: SQLite.Statement<[name: string], DataRange>
  private deleteEntryRangeStatement: SQLite.Statement<[name: string], void>

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

      CREATE TABLE IF NOT EXISTS ranges (
        entry_name TEXT PRIMARY KEY,
        entry_min REAL,
        entry_max REAL
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
    this.setEntryRangeStatement = this.sqlite.prepare(`
      INSERT OR REPLACE INTO ranges (entry_name, entry_min, entry_max) VALUES (?, ?, ?)
    `)
    this.getEntryRangeStatement = this.sqlite.prepare(`
      SELECT entry_min AS min, entry_max AS max FROM ranges WHERE entry_name = ?
    `)
    this.deleteEntryRangeStatement = this.sqlite.prepare(`
      DELETE FROM ranges WHERE entry_name = ?  
    `)
  }

  async getAllEntries(): Promise<string[]> {
    return this.getAllEntriesStatement.all().map(x => x.name)
  }
  async getEntries(name: string, fromTimestamp: number, toTimestamp: number): Promise<DataEntry[]> {
    return this.getEntriesStatement.all(name, fromTimestamp, toTimestamp)
  }
  async pushEntry(name: string, timestamp: number, value: number): Promise<void> {
    this.pushEntryStatement.run(name, timestamp, value)
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
  async setEntryRange(name: string, min: number | null, max: number | null) {
    this.setEntryRangeStatement.run(name, min, max)
  }
  async getEntryRange(name: string) {
    return this.getEntryRangeStatement.get(name) || null
  }
  async deleteEntryRange(name: string) {
    this.deleteEntryRangeStatement.run(name)
  }
}