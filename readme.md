# korekuta

A simple service for tracking single-numerical data over time.

## INSTALLATION

```console
$ cd korekuta
$ npm install

$ npm run dev   # for dev environment
$ npm run dist  # compile and run
```

The service also accepts the following environmental variables. If they are not present, default values will be used.

| Variable                  | Default Value | Description                                                             |
| ------------------------- | ------------- | ----------------------------------------------------------------------- |
| `KOREKUTA_HOST`           | `0.0.0.0`     |                                                                         |
| `KOREKUTA_PORT`           | `65001`       |                                                                         |
| `KOREKUTA_TRIM_RETENTION` | 604800000     | During trim, retain only the last `n` miliseconds. Defaults to a week.  |
| `KOREKUTA_TRIM_INTERVAL`  | 3600000       | Perform trim every `n` miliseconds. Defaults to an hour.                |
| `KOREKUTA_DATABASE_PATH`  | `:memory:`    | Path where a SQLite database is located. Default to in-memory database. |

## USAGE

All interfaces are accessed using simple REST endpoints.

### `GET /api/entries`

Retrieves a list of entry names present in the database.

### `GET /api/entries/:name`

Retrieves captured data within the `name` entry. If the `name` is not present in the database, an empty array is returned.

You can specify the range using `from=` and `to=` search query, both of which are UNIX timestamps in miliseconds. If not specified, it will return everything.

```json
[
  {
    "timestamp": 1736427650794,
    "value": 1204
  },
  {
    "timestamp": 1736427653178,
    "value": 1208
  }
]
```

### `POST /api/entries/:name`

Accepts the data as a stringified number. It will append the given value to `name` at server timestamp.

Returns the entry that was added to the database.

```json
{
  "timestamp": 1736427792543,
  "value": 1208
}
```

### `DELETE /api/entries/:name`

Deletes *all* entries of `name`.