## Local Test Scripts

These scripts are for local development/testing only.
Do not run them in production.
Do not commit real secrets.
They require `backend/.env` to be configured locally.

Scripts:

* `testBktCallback.js`: simulates BKT callback cases.
* `e2e_bkt_test.js`: creates real test bookings/payments and simulates paid/failed callbacks locally.
* `admin_test_call.js`: tests the admin SMTP test-email endpoint.
