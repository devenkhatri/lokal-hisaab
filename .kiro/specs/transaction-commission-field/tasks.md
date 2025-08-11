# Implementation Plan

- [x] 1. Update database schema and TypeScript types
  - Add commission column to Supabase transactions table with appropriate constraints
  - Update TypeScript type definitions in types.ts to include commission field
  - Ensure backward compatibility with optional commission field
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Update API layer to handle commission data
  - Modify transactionsApi functions to include commission in CRUD operations
  - Update Transaction interface in api.ts to include commission field
  - Ensure commission field is properly handled in database queries
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 3. Add commission field to transaction form UI
  - Add commission input field to the transaction form in Transactions.tsx
  - Position commission field appropriately near the amount field
  - Implement form state management for commission field
  - Add validation for non-negative decimal commission values
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.4_

- [x] 4. Update transaction display and table to show commission
  - Add commission column to the transactions table display
  - Implement proper currency formatting for commission values
  - Handle responsive design considerations for the additional column
  - Ensure commission displays correctly in transaction lists
  - _Requirements: 1.5, 4.1, 4.2, 4.3_

- [x] 5. Update CSV export functionality to include commission
  - Modify exportToCSV function to include Commission column in exports
  - Ensure commission values are properly formatted in CSV output
  - Update CSV header to include Commission field
  - _Requirements: 2.1, 4.1, 4.2_

- [x] 6. Update CSV import functionality to handle commission
  - Modify CSV import logic to accept Commission field from import files
  - Handle missing commission values by defaulting to zero
  - Add validation for commission values during import process
  - Update import error handling for invalid commission data
  - _Requirements: 2.2, 2.3, 2.4, 1.4_

- [x] 7. Update sample CSV file with commission examples
  - Add Commission column to the sample CSV file
  - Include realistic commission values in sample data
  - Update downloadSampleCSV function to include commission field
  - _Requirements: 2.1, 2.2_

- [x] 8. Add commission field to transaction editing functionality
  - Ensure commission field appears in edit transaction dialog
  - Populate commission field with existing values when editing
  - Handle commission updates in the edit transaction flow
  - _Requirements: 1.2, 3.1, 3.2_

- [x] 9. Implement commission validation and error handling
  - Add client-side validation for commission field format and constraints
  - Implement proper error messages for invalid commission values
  - Ensure commission validation integrates with existing form validation
  - _Requirements: 1.4, 2.4, 4.4_

- [x] 10. Test commission functionality end-to-end
  - Write unit tests for commission field validation and formatting
  - Test commission field in transaction creation, editing, and display
  - Verify commission data persistence and retrieval from database
  - Test CSV import/export with commission data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_