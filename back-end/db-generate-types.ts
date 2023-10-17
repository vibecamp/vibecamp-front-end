
import { withDBConnection } from "./db.ts";

type DataType =
    | 'boolean'
    | 'text'
    | 'integer'
    | 'timestamp with time zone'
    | 'date'
    | 'point'
    | 'uuid'

const columns = await withDBConnection(async db => (await db.queryObject<{
    table_name: string,
    column_name: string,
    data_type: DataType,
    is_nullable: 'YES' | 'NO'
}>`
    SELECT information_schema.tables.table_name, column_name, data_type, is_nullable
    FROM information_schema.tables, information_schema.columns
    WHERE information_schema.tables.table_schema = 'public' AND information_schema.tables.table_name = information_schema.columns.table_name
    ORDER BY information_schema.tables.table_name ASC
`).rows)

const tables: Record<string, Array<{ column_name: string, type: string }>> = {}

const TYPE_MAP: Record<DataType, string> = {
    'boolean': 'boolean',
    'text': 'string',
    'uuid': 'string',
    'integer': 'number',
    'point': 'unknown',
    'date': 'unknown',
    'timestamp with time zone': 'unknown'
}

for (const { table_name, column_name, data_type, is_nullable } of columns) {
    if (tables[table_name] == null) {
        tables[table_name] = []
    }

    tables[table_name]?.push({
        column_name,
        type: TYPE_MAP[data_type] + (is_nullable === 'YES' ? ' | null' : '')
    })
}

const dbTypesStr =
    `export type Tables = {
${Object.entries(tables).map(([tableName, columns]) =>
        `  ${tableName}: {
${columns.map(({ column_name, type }) => `    ${column_name}: ${type},`).join('\n')}
  },`).join('\n')}
}

export type TableName = keyof Tables`

await Deno.writeTextFile('./db-types.ts', dbTypesStr)