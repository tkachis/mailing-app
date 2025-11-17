import * as path from 'path';

import dotenv from 'dotenv';
import { sql as sqlOp } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as XLSX from 'xlsx';

import { pkdNumbersTable } from '../src/db/schema';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface NewPkdNumber {
  pkdNumber: string;
  name: string;
}

function parsePkdFile(filePath: string): NewPkdNumber[] {
  console.log(`📖 Reading file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
  });

  console.log(`📊 Total rows in file: ${rawData.length}`);

  const pkdNumbers: NewPkdNumber[] = [];

  // Skip first 2 rows (document header and column headers)
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip empty rows
    if (!row || row.length === 0 || row.every((cell) => !cell)) {
      continue;
    }

    const [dział, grupa, klasa, podklasa, nazwa] = row;

    // Skip rows with section headers (SEKCJA A, SEKCJA B, etc.)
    if (
      dział &&
      typeof dział === 'string' &&
      dział.toUpperCase().startsWith('SEKCJA')
    ) {
      continue;
    }

    // Extract PKD code and name
    // Structure: [Dział, Grupa, Klasa, Podklasa, Nazwa]
    // We need the most detailed level code with name

    let pkdCode: string | null = null;
    let pkdName: string | null = null;

    // Priority: Podklasa > Klasa > Grupa > Dział
    if (podklasa && typeof podklasa === 'string' && podklasa.trim()) {
      pkdCode = podklasa.trim();
      pkdName = nazwa && typeof nazwa === 'string' ? nazwa.trim() : null;
    } else if (klasa && typeof klasa === 'string' && klasa.trim()) {
      pkdCode = klasa.trim();
      pkdName = nazwa && typeof nazwa === 'string' ? nazwa.trim() : null;
    } else if (grupa && typeof grupa === 'string' && grupa.trim()) {
      pkdCode = grupa.trim();
      pkdName = nazwa && typeof nazwa === 'string' ? nazwa.trim() : null;
    } else if (dział && typeof dział === 'string' && dział.trim()) {
      pkdCode = dział.trim();
      pkdName = nazwa && typeof nazwa === 'string' ? nazwa.trim() : null;
    }

    // Add only if both code and name exist, and code matches PKD format
    if (
      pkdCode &&
      pkdName &&
      pkdCode.match(/^\d{2}(\.\d+)?(\.\w+)?$/) // Format: XX or XX.X or XX.XX or XX.XX.Z
    ) {
      pkdNumbers.push({
        pkdNumber: pkdCode,
        name: pkdName,
      });
    }
  }

  console.log(`✅ Found PKD codes: ${pkdNumbers.length}`);
  return pkdNumbers;
}

async function importPkdCodes() {
  const dbUrl = process.env.NEXT_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('NEXT_DATABASE_URL is not set');
  }

  // Create connection with settings
  const pgClient = postgres(dbUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(pgClient, {
    schema: {
      pkdNumbers: pkdNumbersTable,
    },
  });

  try {
    const filePath = path.join(process.cwd(), '.tmp', 'StrukturaPKD2025.xls');

    // Parse file
    const pkdNumbers = parsePkdFile(filePath);

    if (pkdNumbers.length === 0) {
      console.log('⚠️  No PKD codes found for import');
      return;
    }

    console.log('\n📝 Examples of found codes:');
    pkdNumbers.slice(0, 5).forEach((pkd) => {
      console.log(`  ${pkd.pkdNumber} - ${pkd.name}`);
    });

    // Load into database in batches of 50 records
    console.log('\n💾 Starting database upload...');

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < pkdNumbers.length; i += batchSize) {
      const batch = pkdNumbers.slice(i, i + batchSize);

      await db
        .insert(pkdNumbersTable)
        .values(batch)
        .onConflictDoUpdate({
          target: [pkdNumbersTable.pkdNumber],
          set: {
            name: sqlOp`EXCLUDED.name`,
          },
        });

      processed += batch.length;
      console.log(`  Processed: ${processed}/${pkdNumbers.length}`);
    }

    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total PKD codes loaded: ${pkdNumbers.length}`);
  } catch (error) {
    console.error('❌ Error importing PKD codes:', error);
    throw error;
  } finally {
    // Close DB connection
    await pgClient.end();
  }
}

// Run import
importPkdCodes()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
