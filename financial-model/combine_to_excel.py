#!/usr/bin/env python3
"""
Combine all CSV files into a single Excel workbook
Usage: python3 combine_to_excel.py
"""

import pandas as pd
import os

# Define the files and their sheet names
files = [
    ('01_Dashboard_Summary.csv', 'Dashboard'),
    ('02_Assumptions_Sources.csv', 'Assumptions & Sources'),
    ('03_Revenue_Model_Monthly.csv', 'Revenue Model'),
    ('04_Unit_Economics.csv', 'Unit Economics'),
    ('05_Operating_Expenses.csv', 'Operating Expenses'),
    ('06_Cash_Flow_Runway.csv', 'Cash Flow & Runway'),
    ('07_Sensitivity_Analysis.csv', 'Sensitivity Analysis'),
]

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Output file
output_file = os.path.join(script_dir, 'INNARA_Financial_Model.xlsx')

# Create Excel writer
with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
    for filename, sheet_name in files:
        filepath = os.path.join(script_dir, filename)

        # Read CSV
        df = pd.read_csv(filepath)

        # Write to Excel
        df.to_excel(writer, sheet_name=sheet_name, index=False)

        print(f"✓ Added {sheet_name}")

print(f"\n✅ Excel file created: {output_file}")
print("Ready to share with investors!")
