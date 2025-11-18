# TODO: Add Calendar Picker to AdminHistory

## Completed Tasks
- [x] Install react-datepicker in client project
- [x] Update backend/models/AdminHistory.js: Modify getHistory method to accept startDate and endDate parameters, adding WHERE clause to filter by moved_to_history_at or deleted_at between dates
- [x] Update backend/controllers/adminHistoryController.js: Modify getHistory controller to parse startDate and endDate from req.query and pass to model
- [x] Update client/src/features/admin/routes/dashboard/AdminHistory.jsx:
  - [x] Add imports for DatePicker and CSS
  - [x] Add state for startDate and endDate
  - [x] Add DatePicker components for "From Date" and "To Date" in filters section
  - [x] Add "Generate History" button that calls fetchHistory with selected dates
  - [x] Modify fetchHistory to append startDate and endDate as query parameters to API URL

## Followup Steps
- [ ] Test the date range filtering functionality
- [ ] Ensure dates are validated (e.g., startDate before endDate)
- [ ] If needed, add a "Clear Dates" button to reset the filter
