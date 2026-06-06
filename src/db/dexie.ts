import Dexie, { type Table } from 'dexie'
import type { HealthRecord, UserSettings } from '@/types/health'
import { DB_NAME, DB_VERSION, TABLES } from './schema'

export class HealthDB extends Dexie {
  records!: Table<HealthRecord, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores({
      [TABLES.records]: 'id, type, subType, datetime, isAbnormal, createdAt',
      [TABLES.settings]: 'id',
    })
  }
}

export const db = new HealthDB()
