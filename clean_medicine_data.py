import pandas as pd
import os

# Define input and output file names
input_csv_file = 'medicine_data.csv'
output_csv_file = 'medicine_data_cleaned.csv'

# Define the columns to check for duplicates
# A more precise definition: same product name, salt composition, and manufacturer
duplicate_check_columns = ['product_name', 'salt_composition', 'product_manufactured']

print(f"Starting data cleaning process for '{input_csv_file}'...")

# Check if the input file exists
if not os.path.exists(input_csv_file):
    print(f"Error: Input file '{input_csv_file}' not found in the current directory.")
    exit(1)

try:
    # Read the CSV file into a pandas DataFrame
    print("Reading CSV file...")
    # Specify low_memory=False to potentially avoid dtype warnings with large files
    df = pd.read_csv(input_csv_file, low_memory=False)
    print(f"Read {len(df)} rows.")

    # Display initial number of rows
    initial_rows = len(df)
    print(f"Initial number of rows: {initial_rows}")

    # Drop duplicate rows based on the specified columns
    print(f"Removing duplicates based on columns: {', '.join(duplicate_check_columns)}...")
    df_cleaned = df.drop_duplicates(subset=duplicate_check_columns, keep='first')

    # Display number of rows after cleaning
    final_rows = len(df_cleaned)
    rows_removed = initial_rows - final_rows
    print(f"Removed {rows_removed} duplicate rows.")
    print(f"Final number of rows: {final_rows}")

    # Save the cleaned DataFrame to a new CSV file
    print(f"Saving cleaned data to '{output_csv_file}'...")
    # index=False prevents pandas from writing the DataFrame index as a column
    df_cleaned.to_csv(output_csv_file, index=False, encoding='utf-8')

    print("Data cleaning process completed successfully.")
    print(f"Cleaned data saved to '{output_csv_file}'.")

except Exception as e:
    print(f"An error occurred during the cleaning process: {e}")
    exit(1)
