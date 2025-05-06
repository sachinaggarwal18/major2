import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface CsvRow {
  sub_category: string;
  product_name: string;
  salt_composition: string;
  product_price: string; // Keep as string initially
  product_manufactured: string;
  medicine_desc: string;
  side_effects: string;
  drug_interactions: string;
}

async function main() {
  console.log('Starting medication seeding process using cleaned data...');

  const medicationsToCreate: any[] = []; // Use 'any' for flexibility during parsing
  const csvFilePath = path.resolve(__dirname, '../../medicine_data_cleaned.csv'); // Use the cleaned CSV file

  // Check if CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: CSV file not found at ${csvFilePath}`);
    return; // Exit if file doesn't exist
  }

  console.log(`Reading CSV file from: ${csvFilePath}`);

  // Create a promise to handle the stream completion
  const streamPromise = new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row: CsvRow) => {
        // Basic validation: Ensure essential fields are present
        if (!row.product_name || !row.salt_composition || !row.product_manufactured) {
          console.warn('Skipping row due to missing essential data:', row);
          return; // Skip rows with missing essential data
        }

        medicationsToCreate.push({
          productName: row.product_name.trim(),
          saltComposition: row.salt_composition.trim(),
          manufacturer: row.product_manufactured.trim(),
          // Handle optional fields, provide null if empty or missing
          subCategory: row.sub_category?.trim() || null,
          sideEffects: row.side_effects?.trim() || null,
          drugInteractions: row.drug_interactions?.trim() || null,
        });
      })
      .on('end', () => {
        console.log(`CSV file successfully processed. Found ${medicationsToCreate.length} valid records.`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading or parsing CSV file:', error);
        reject(error);
      });
  });

  try {
    // Wait for the stream processing to complete
    await streamPromise;

    if (medicationsToCreate.length > 0) {
      // Clear existing data
      console.log('Clearing existing MedicationMaster data...');
      await prisma.medicationMaster.deleteMany({});
      console.log('Existing data cleared.');

      // Insert new data in batches to avoid potential payload size limits
      const batchSize = 500; // Adjust batch size as needed
      console.log(`Inserting ${medicationsToCreate.length} records in batches of ${batchSize}...`);
      for (let i = 0; i < medicationsToCreate.length; i += batchSize) {
        const batch = medicationsToCreate.slice(i, i + batchSize);
        await prisma.medicationMaster.createMany({
          data: batch,
          skipDuplicates: true, // Although we delete first, this adds safety
        });
        console.log(`Inserted batch ${i / batchSize + 1}...`);
      }
      console.log('Data insertion complete.');
    } else {
      console.log('No valid medication records found in CSV to insert.');
    }

    console.log('Medication seeding finished successfully.');

  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1); // Exit with error code
  } finally {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  }
}

main();
