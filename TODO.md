# Folder Structure Reorganization Plan

## Backend Changes
- [ ] Create backend/src/ directory
- [ ] Move server.js to backend/src/
- [ ] Move server_socket.js to backend/src/
- [ ] Create backend/scripts/ directory
- [ ] Move createAdmin.js to backend/scripts/
- [ ] Create backend/database/migrations/ directory
- [ ] Move and rename database_migration.sql to backend/database/migrations/migration.sql
- [ ] Update package.json main entry if needed
- [ ] Update any import paths in moved files

## Client Changes
- [ ] Create client/src/layouts/ directory
- [ ] Move shared layouts from Dash/layouts/ and CustomerDash/layouts/ to client/src/layouts/
- [ ] Create client/src/hooks/ directory
- [ ] Move hooks from Dash/hooks/ to client/src/hooks/
- [ ] Create client/src/utils/ directory
- [ ] Move shared utils from Dash/utils/ to client/src/utils/
- [ ] Create client/src/constants/ directory
- [ ] Move constants from Dash/constants/ and CustomerDash/constants/ to client/src/constants/
- [ ] Create client/src/features/ directory
- [ ] Rename Dash/ to features/admin/
- [ ] Rename CustomerDash/ to features/customer/
- [ ] Update all import paths in App.jsx and other files
- [ ] Remove old/unused files (AboutService_old.jsx, x folder)
- [ ] Consolidate duplicate components if any

## Testing
- [ ] Test backend starts correctly
- [ ] Test client builds and runs
- [ ] Test routing works after path changes
- [ ] Test login functionality
