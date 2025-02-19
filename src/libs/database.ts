export type DataEntry = {
  timestamp: number,
  value: number
}

export type DataRange = {
  min: number | null,
  max: number | null
}

export abstract class Database {
  /** Retrieves all entries present within the database. */
  abstract getAllEntries(): Promise<string[]>

  /** Retrieves all entries of `name` from where `fromTimestamp <= timestamp <= toTimestamp` */
  abstract getEntries(name: string, fromTimestamp: number, toTimestamp: number): Promise<DataEntry[]>
  /** Pushes `value` into (or creates) a list called `name` at that particular time. */
  abstract pushEntry(name: string, timestamp: number, value: number): Promise<void>

  /** All entries of `name` that have `timestamp < timestampThreshold` will be removed. */
  abstract trimEntries(name: string, timestampThreshold: number): Promise<void>
  /** All entries that have `timestamp < timestampThreshold` will be removed. */
  abstract trimAllEntries(timestampThreshold: number): Promise<void>

  /** Remove all entries of a particular `name`. */
  abstract deleteEntries(name: string): Promise<void>

  abstract setEntryRange(name: string, min: number | null, max: number | null): Promise<void>;
  abstract getEntryRange(name: string): Promise<DataRange | null>;
  abstract deleteEntryRange(name: string): Promise<void>
}
