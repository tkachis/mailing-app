#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'fs';
import { join, resolve } from 'path';

import * as schema from '../src/db/schema';

import type { PgFunction, PgTrigger } from '../src/db/utils';

interface DrizzleKitCommand {
  command: string;
  args: string[];
}

interface CustomEntity {
  name: string;
  sql: string;
  type: string;
  hash: string;
}

interface CustomEntitiesSnapshot {
  functions: Record<string, string>; // name -> hash
  triggers: Record<string, string>; // name -> hash
}

const CUSTOM_ENTITIES_SNAPSHOT_PATH = resolve(
  './src/db/migrations/meta/_custom_entities.json',
);

/**
 * Drizzle-kit command parser
 */
function parseCommand(): DrizzleKitCommand {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const commandArgs = args.slice(1);

  return { command, args: commandArgs };
}

/**
 * Calculate hash for entity SQL
 */
function calculateHash(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

/**
 * Load custom entities snapshot
 */
function loadCustomEntitiesSnapshot(): CustomEntitiesSnapshot {
  if (!existsSync(CUSTOM_ENTITIES_SNAPSHOT_PATH)) {
    return { functions: {}, triggers: {} };
  }

  try {
    const content = readFileSync(CUSTOM_ENTITIES_SNAPSHOT_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { functions: {}, triggers: {} };
  }
}

/**
 * Save custom entities snapshot
 */
function saveCustomEntitiesSnapshot(snapshot: CustomEntitiesSnapshot) {
  writeFileSync(
    CUSTOM_ENTITIES_SNAPSHOT_PATH,
    JSON.stringify(snapshot, null, 2),
  );
}

/**
 * Executes original drizzle-kit command
 */
function executeOriginalCommand(command: string, args: string[]) {
  const fullCommand = `npx drizzle-kit ${command} ${args.join(' ')}`;
  console.log(`🔧 Executing: ${fullCommand}`);

  try {
    execSync(fullCommand, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Error executing drizzle-kit command:', error);
    return false;
  }
}

/**
 * Finds the latest created migration file
 */
function getLatestMigrationFile(): string | null {
  const migrationsDir = resolve('./src/db/migrations');

  try {
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => ({
        name: file,
        path: join(migrationsDir, file),
        mtime: statSync(join(migrationsDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return files.length > 0 ? files[0].path : null;
  } catch {
    return null;
  }
}

/**
 * Extracts custom entities from schema
 */
function extractCustomEntities(): CustomEntity[] {
  const entities: CustomEntity[] = [];

  for (const [, value] of Object.entries(schema)) {
    if (!value || typeof value !== 'object') continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityWithKind = value as any;
    const entityKind =
      entityWithKind.constructor?.[Symbol.for('drizzle:entityKind')];

    if (entityKind === 'PgFunction') {
      const func = value as PgFunction;
      const sql = generateFunctionSQL(func);
      entities.push({
        name: func.name,
        sql,
        type: 'function',
        hash: calculateHash(sql),
      });
    }

    if (entityKind === 'PgTrigger') {
      const trigger = value as PgTrigger;
      const sql = generateTriggerSQL(trigger);
      entities.push({
        name: trigger.name,
        sql,
        type: 'trigger',
        hash: calculateHash(sql),
      });
    }
  }

  return entities;
}

/**
 * Generates SQL for function
 */
function generateFunctionSQL(func: PgFunction): string {
  const returns = func.returns || 'void';
  const language = func.language || 'plpgsql';
  const behavior = func.behavior ? ` ${func.behavior.toUpperCase()}` : '';
  const security = func.security
    ? ` SECURITY ${func.security.toUpperCase()}`
    : '';
  const searchPath =
    func.searchPath !== undefined
      ? ` SET search_path = '${func.searchPath}'`
      : '';

  // Extract function body
  let body = '$$BEGIN END;$$';
  if (func.body) {
    // Check if this is SQL object with queryChunks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sqlBody = func.body as any;
    if (sqlBody.queryChunks?.[0]?.value) {
      body = sqlBody.queryChunks[0].value;
    } else if (typeof func.body === 'string') {
      body = func.body;
    } else {
      // Try to convert SQL object to string
      body = func.body.toString() || body;
    }
  }

  return `CREATE OR REPLACE FUNCTION ${func.name}()
RETURNS ${returns}
LANGUAGE ${language}${behavior}${security}${searchPath}
AS ${body};`;
}

/**
 * Generates SQL for trigger
 */
function generateTriggerSQL(trigger: PgTrigger): string {
  const events =
    trigger.events?.map((e: string) => e.toUpperCase()).join(' OR ') ||
    'INSERT';
  const triggerType = trigger.triggerType?.toUpperCase() || 'AFTER';
  const orientation = trigger.orientation?.toUpperCase() || 'ROW';

  // Get table name
  let tableName = 'unknown_table';
  if (trigger.table) {
    // Get table name from Drizzle table object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableObj = trigger.table as any;

    // Get table name with schema if available - use symbols first (universal)
    const nameSymbol = Symbol.for('drizzle:Name');
    const schemaSymbol = Symbol.for('drizzle:Schema');

    if (tableObj[schemaSymbol] && tableObj[nameSymbol]) {
      // Use symbol-based metadata (works for all table types)
      tableName = `"${tableObj[schemaSymbol]}"."${tableObj[nameSymbol]}"`;
    } else if (tableObj[nameSymbol]) {
      tableName = tableObj[nameSymbol];
    } else if (tableObj.name) {
      tableName = tableObj.name;
    }
  }

  const functionName = trigger.function?.name || 'unknown_function';

  return `CREATE OR REPLACE TRIGGER ${trigger.name}
${triggerType} ${events}
ON ${tableName}
FOR EACH ${orientation}
EXECUTE FUNCTION ${functionName}();`;
}

/**
 * Adds custom entities to migration file
 */
function appendCustomEntitiesToMigration(migrationFile: string) {
  const currentEntities = extractCustomEntities();

  if (currentEntities.length === 0) {
    console.log('📝 No custom functions and triggers found');
    return;
  }

  // Load previous snapshot
  const previousSnapshot = loadCustomEntitiesSnapshot();

  // Find changed or new entities
  const changedEntities = currentEntities.filter((entity) => {
    const previousHash =
      entity.type === 'function'
        ? previousSnapshot.functions[entity.name]
        : previousSnapshot.triggers[entity.name];

    // Entity is new or changed
    return !previousHash || previousHash !== entity.hash;
  });

  if (changedEntities.length === 0) {
    console.log('📝 No changes in custom functions and triggers');
    return;
  }

  const existingContent = readFileSync(migrationFile, 'utf-8');

  // Check if custom entities are already added to this migration
  const hasCustomEntities = changedEntities.some((entity) =>
    existingContent.includes(`-- ${entity.type.toUpperCase()}: ${entity.name}`),
  );

  if (hasCustomEntities) {
    console.log('📝 Custom entities already added to migration');
    return;
  }

  // Separate functions and triggers, functions first
  const functions = changedEntities.filter(
    (entity) => entity.type === 'function',
  );
  const triggers = changedEntities.filter(
    (entity) => entity.type === 'trigger',
  );

  const customSQL = [...functions, ...triggers]
    .map(
      (entity) =>
        `-- ${entity.type.toUpperCase()}: ${entity.name}\n${entity.sql}`,
    )
    .join('\n\n');

  const updatedContent =
    existingContent + '\n\n-- Custom Functions and Triggers\n' + customSQL;

  writeFileSync(migrationFile, updatedContent);

  console.log(
    `✅ Added ${changedEntities.length} changed custom entities to migration:`,
  );
  changedEntities.forEach((entity) => {
    const isNew =
      entity.type === 'function'
        ? !previousSnapshot.functions[entity.name]
        : !previousSnapshot.triggers[entity.name];
    const status = isNew ? 'NEW' : 'CHANGED';
    console.log(`   - ${entity.type}: ${entity.name} (${status})`);
  });

  // Update snapshot with current state
  const newSnapshot: CustomEntitiesSnapshot = {
    functions: {},
    triggers: {},
  };

  currentEntities.forEach((entity) => {
    if (entity.type === 'function') {
      newSnapshot.functions[entity.name] = entity.hash;
    } else {
      newSnapshot.triggers[entity.name] = entity.hash;
    }
  });

  saveCustomEntitiesSnapshot(newSnapshot);
  console.log('💾 Updated custom entities snapshot');
}

/**
 * Main wrapper logic
 */
async function main() {
  const { command, args } = parseCommand();

  console.log(`🚀 Drizzle Kit Wrapper - command: ${command}`);

  // Execute original command
  const success = executeOriginalCommand(command, args);

  if (!success) {
    process.exit(1);
  }

  // If this is generate command, add custom entities
  if (command === 'generate' && !args.includes('--custom')) {
    console.log('🔍 Looking for created migrations to add custom entities...');

    // Small delay to let the file be created
    await new Promise((resolve) => setTimeout(resolve, 100));

    const latestMigration = getLatestMigrationFile();

    if (latestMigration) {
      console.log(`📄 Found migration file: ${latestMigration}`);
      appendCustomEntitiesToMigration(latestMigration);
    } else {
      console.log('❌ Migration file not found');
    }
  }

  console.log('✅ Command executed successfully');
}

// Startup
if (require.main === module) {
  main().catch(console.error);
}
