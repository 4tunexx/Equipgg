// Database abstraction layer for switching between sql.js and Prisma
import { PrismaClient } from '@prisma/client';

// Types for database operations
export interface DatabaseResult<T = any> {
  data: T | null;
  error?: string;
}

export interface DatabaseResults<T = any> {
  data: T[];
  error?: string;
}

export interface DatabaseOperation {
  success: boolean;
  error?: string;
  id?: string | number;
}

// Database interface
export interface DatabaseInterface {
  // Single record operations
  findOne<T = any>(table: string, where: Record<string, any>): Promise<DatabaseResult<T>>;
  findMany<T = any>(table: string, where?: Record<string, any>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<DatabaseResults<T>>;
  
  // Create operations
  create<T = any>(table: string, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }>;
  createMany<T = any>(table: string, data: Record<string, any>[]): Promise<DatabaseOperation & { count?: number }>;
  
  // Update operations
  update<T = any>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }>;
  updateMany(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { count?: number }>;
  
  // Delete operations
  delete(table: string, where: Record<string, any>): Promise<DatabaseOperation>;
  deleteMany(table: string, where: Record<string, any>): Promise<DatabaseOperation & { count?: number }>;
  
  // Raw SQL operations (for complex queries)
  executeRaw<T = any>(sql: string, params?: any[]): Promise<DatabaseResults<T>>;
  
  // Transaction support
  transaction<T>(callback: (tx: DatabaseInterface) => Promise<T>): Promise<T>;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

// SQL.js implementation (for local development)
class SqliteDatabase implements DatabaseInterface {
  private db: any = null;
  private dbMutex = false;

  async connect(): Promise<void> {
    // This will be handled by the existing sql.js setup
    const { getDb } = await import('./db');
    this.db = await getDb();
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async findOne<T = any>(table: string, where: Record<string, any>): Promise<DatabaseResult<T>> {
    try {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);
      const sql = `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`;
      
      const stmt = this.db.prepare(sql);
      stmt.bind(values);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      
      return { data: row as T };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async findMany<T = any>(table: string, where?: Record<string, any>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<DatabaseResults<T>> {
    try {
      let sql = `SELECT * FROM ${table}`;
      const values: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        sql += ` WHERE ${conditions}`;
        values.push(...Object.values(where));
      }

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      if (options?.limit) {
        sql += ` LIMIT ${options.limit}`;
      }

      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }

      const stmt = this.db.prepare(sql);
      stmt.bind(values);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      stmt.free();

      return { data: rows };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async create<T = any>(table: string, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data);
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      stmt.free();

      // Get the inserted record
      const insertedId = this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
      const insertedRecord = await this.findOne<T>(table, { id: insertedId });

      return { success: true, id: insertedId, data: insertedRecord.data || undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createMany<T = any>(table: string, data: Record<string, any>[]): Promise<DatabaseOperation & { count?: number }> {
    try {
      if (data.length === 0) {
        return { success: true, count: 0 };
      }

      const columns = Object.keys(data[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      const stmt = this.db.prepare(sql);
      let count = 0;
      for (const record of data) {
        stmt.run(Object.values(record));
        count++;
      }
      stmt.free();

      return { success: true, count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update<T = any>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = [...Object.values(data), ...Object.values(where)];
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      stmt.free();

      // Get the updated record
      const updatedRecord = await this.findOne<T>(table, where);

      return { success: true, data: updatedRecord.data || undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateMany(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { count?: number }> {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = [...Object.values(data), ...Object.values(where)];
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      const count = this.db.getRowsModified();
      stmt.free();

      return { success: true, count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(table: string, where: Record<string, any>): Promise<DatabaseOperation> {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      stmt.free();

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteMany(table: string, where: Record<string, any>): Promise<DatabaseOperation & { count?: number }> {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      const count = this.db.getRowsModified();
      stmt.free();

      return { success: true, count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async executeRaw<T = any>(sql: string, params: any[] = []): Promise<DatabaseResults<T>> {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      stmt.free();

      return { data: rows };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async transaction<T>(callback: (tx: DatabaseInterface) => Promise<T>): Promise<T> {
    // SQL.js doesn't have built-in transaction support, so we'll just execute the callback
    // In a real implementation, you might want to implement a simple transaction mechanism
    return await callback(this);
  }
}

// Prisma implementation (for production)
class PrismaDatabase implements DatabaseInterface {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async findOne<T = any>(table: string, where: Record<string, any>): Promise<DatabaseResult<T>> {
    try {
      const result = await (this.prisma as any)[table].findFirst({ where });
      return { data: result as T };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async findMany<T = any>(table: string, where?: Record<string, any>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<DatabaseResults<T>> {
    try {
      const queryOptions: any = {};
      
      if (where) {
        queryOptions.where = where;
      }
      
      if (options?.limit) {
        queryOptions.take = options.limit;
      }
      
      if (options?.offset) {
        queryOptions.skip = options.offset;
      }
      
      if (options?.orderBy) {
        const [field, direction] = options.orderBy.split(' ');
        queryOptions.orderBy = { [field]: direction || 'asc' };
      }

      const results = await (this.prisma as any)[table].findMany(queryOptions);
      return { data: results as T[] };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async create<T = any>(table: string, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
    try {
      const result = await (this.prisma as any)[table].create({ data });
      return { success: true, data: result as T, id: result.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createMany<T = any>(table: string, data: Record<string, any>[]): Promise<DatabaseOperation & { count?: number }> {
    try {
      const result = await (this.prisma as any)[table].createMany({ data });
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update<T = any>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
    try {
      const result = await (this.prisma as any)[table].update({ where, data });
      return { success: true, data: result as T };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateMany(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { count?: number }> {
    try {
      const result = await (this.prisma as any)[table].updateMany({ where, data });
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(table: string, where: Record<string, any>): Promise<DatabaseOperation> {
    try {
      await (this.prisma as any)[table].delete({ where });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteMany(table: string, where: Record<string, any>): Promise<DatabaseOperation & { count?: number }> {
    try {
      const result = await (this.prisma as any)[table].deleteMany({ where });
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async executeRaw<T = any>(sql: string, params: any[] = []): Promise<DatabaseResults<T>> {
    try {
      const results = await this.prisma.$queryRawUnsafe(sql, ...params) as T[];
      return { data: results };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async transaction<T>(callback: (tx: DatabaseInterface) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (prisma: any) => {
      const txDatabase = new PrismaDatabase();
      (txDatabase as any).prisma = prisma;
      return await callback(txDatabase);
    });
  }
}

// Database factory
export class DatabaseFactory {
  private static instance: DatabaseInterface | null = null;

  static async getDatabase(): Promise<DatabaseInterface> {
    if (!this.instance) {
      const databaseType = process.env.DATABASE_TYPE || 'sqlite';
      
      if (databaseType === 'postgresql') {
        this.instance = new PrismaDatabase();
      } else {
        this.instance = new SqliteDatabase();
      }
      
      await this.instance.connect();
    }
    
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}

// Convenience functions that use the factory
export async function db() {
  return await DatabaseFactory.getDatabase();
}

export async function findOne<T = any>(table: string, where: Record<string, any>): Promise<DatabaseResult<T>> {
  const database = await db();
  return await database.findOne<T>(table, where);
}

export async function findMany<T = any>(table: string, where?: Record<string, any>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<DatabaseResults<T>> {
  const database = await db();
  return await database.findMany<T>(table, where, options);
}

export async function create<T = any>(table: string, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
  const database = await db();
  return await database.create<T>(table, data);
}

export async function update<T = any>(table: string, where: Record<string, any>, data: Record<string, any>): Promise<DatabaseOperation & { data?: T }> {
  const database = await db();
  return await database.update<T>(table, where, data);
}

export async function remove(table: string, where: Record<string, any>): Promise<DatabaseOperation> {
  const database = await db();
  return await database.delete(table, where);
}

export async function executeRaw<T = any>(sql: string, params: any[] = []): Promise<DatabaseResults<T>> {
  const database = await db();
  return await database.executeRaw<T>(sql, params);
}

export async function transaction<T>(callback: (tx: DatabaseInterface) => Promise<T>): Promise<T> {
  const database = await db();
  return await database.transaction(callback);
}
