2018-08-07, Version 3.3.0
=========================

 * update to MIT license (Diana Lau)

 * chore: update node + dependencies (virkt25)

 * Increase test limit from 9.9 to 30 seconds (Miroslav Bajtoš)

 * Move Mocha config to `test/mocha.opts` (Miroslav Bajtoš)

 * [WebFM] cs/pl/ru translation (candytangnb)


2018-05-04, Version 3.2.1
=========================

 * chore: update CODEOWNERS (Diana Lau)

 * Update Queries to Uppercase (Rafael E. Ajuria)


2017-11-29, Version 3.2.0
=========================

 * Implement test for single column indices (Daan Middendorp)

 * Fix single column index altering (Daan Middendorp)

 * Fix deletion of indices and test (Daan Middendorp)

 * Solve index naming issue (Daan Middendorp)

 * Test update indexes (Daan Middendorp)

 * Fix altering of indexes (Daan Middendorp)

 * Solved imported unittests for previous commit (Daan Middendorp)

 * Fix showIndexes function (Daan Middendorp)

 * Fix bigint (jannyHou)


2017-10-05, Version 3.1.0
=========================

 * update globalize string (Diana Lau)

 * Add stalebot configuration (Kevin Delisle)

 * Create Issue and PR Templates (#167) (Sakib Hasan)

 * Add CODEOWNER file (Diana Lau)

 * Require init on mocha args (ssh24)

 * Add docker setup (#148) (Sakib Hasan)

 * Return if column is generated or not (#100) (Christiaan Westerbeek)

 * Fix discovery of primary keys (#99) (Christiaan Westerbeek)

 * Remove appveyor service (#145) (Sakib Hasan)

 * Fix params for isActual function (#143) (Nguyễn Kim Kha)

 * Enable clean DB seed as pre-test (#142) (Sakib Hasan)

 * Fix eslint issues & buildPropertyType() signature (Raymond Feng)

 * Upgrade deps to mssql@4.x (Raymond Feng)

 * add appveyor for CI (#137) (Ryan Graham)

 * fix discovery turkish collation (#123) (emrahcetiner)


2017-03-31, Version 3.0.0
=========================

 * Replicate issue_template from loopback repo (#120) (siddhipai)

 * Refactor alter table (#134) (Diana Lau)

 * Upgrade to loopback-connector@4.x (Loay)

 * Refactor migration methods (ssh24)

 * Refactor discovery methods (Loay Gewily)

 * Update mocha timeout (Loay Gewily)

 * Update LB-connector version (Loay)

 * Add buildreplace method (Loay Gewily)

 * Update README.md (#117) (Rand McKinney)

 * Update w info from docs (#115) (Rand McKinney)

 * Update paid support URL (Siddhi Pai)

 * increase the timeout for autoupdate test (Eddie Monge)

 * Start 3.x + drop support for Node v0.10/v0.12 (siddhipai)

 * Drop support for Node v0.10 and v0.12 (Siddhi Pai)

 * Start the development of the next major version (Siddhi Pai)

 * Update README doc links (Candy)


2016-10-14, Version 2.9.0
=========================

 * Add connectorCapabilities global object (#102) (Nicholas Duffy)

 * Update translation files - round#2 (Candy)

 * Add translated files (gunjpan)

 * Update deps to loopback 3.0.0 RC (Miroslav Bajtoš)

 * Update eslint infrastructure (Loay)

 * Use juggler@3 for running tests (Simon Ho)

 * Add globalization (Candy)

 * Revert "Update Fix" (Loay)

 * Update Fix (Loay)

 * Update URLs in CONTRIBUTING.md (#88) (Ryan Graham)


2016-06-21, Version 2.8.0
=========================

 * update copyright notices and license (Ryan Graham)

 * Lazy connect when booting app (juehou)

 * Add feature/eslint (Amir-61)

 * Fix linting errors (Amir Jafarian)

 * Auto-update by eslint --fix (Amir Jafarian)

 * Add eslint infrastructure (Amir Jafarian)


2016-04-07, Version 2.7.1
=========================

 * Keep float numbers (Raymond Feng)

 * override other settings if url provided (juehou)


2016-04-05, Version 2.7.0
=========================

 * Use request.input to avoid SQL injection (Raymond Feng)


2016-03-15, Version 2.6.0
=========================

 * Remove regenerator from babel-runtime and bundle mssql (Raymond Feng)


2016-03-10, Version 2.5.1
=========================

 * Remove the license check (Raymond Feng)


2016-03-04, Version 2.5.0
=========================



2016-02-19, Version 2.4.1
=========================

 * Remove sl-blip from dependencies (Miroslav Bajtoš)


2016-02-09, Version 2.4.0
=========================

 * Refactor Fix for Insert into Table with Active Trigger by getting the column data type instead of varchar. https://github.com/strongloop/loopback-connector-mssql/issues/21 (FoysalOsmany)

 * Fix for Insert into Table with Active Trigger https://github.com/strongloop/loopback-connector-mssql/issues/21 (FoysalOsmany)

 * Upgrade should to 8.0.2 (Simon Ho)

 * Add help for Azure SQL users (Oleksandr Sochka)


2015-11-27, Version 2.3.3
=========================

 * Remove buildPartitionBy() that became redundant (eugene-frb)

 * Updated option that triggers PARTITION BY injection, fixed buildPartitionByFirst's 'where' argument. (eugene-frb)


2015-11-18, Version 2.3.2
=========================

 * Inject Partition By clause into buildColumnNames of SQL query for include filter (eugene-frb)

 * Refer to licenses with a link (Sam Roberts)

 * Use strongloop conventions for licensing (Sam Roberts)


2015-09-11, Version 2.3.1
=========================

 * Allow models without PK (Raymond Feng)


2015-08-14, Version 2.3.0
=========================

 * Added support to unicode (Ahmed Abdul Moniem)


2015-08-13, Version 2.2.1
=========================

 * Allow the `multipleResultSets` flag for execute (Raymond Feng)


2015-07-29, Version 2.2.0
=========================

 * Add support for regex operator (Simon Ho)


2015-05-18, Version 2.1.0
=========================

 * Update deps (Raymond Feng)

 * Add transaction support (Raymond Feng)


2015-05-13, Version 2.0.0
=========================

 * Update deps (Raymond Feng)

 * Refactor the mssql connector to use base SqlConnector (Raymond Feng)

 * Use SET IDENTITY_INSERT option to allow explicit id (Raymond Feng)

 * Return count when updating or deleting models (Simon Ho)

 * Add strongloop license check (Raymond Feng)

 * Add "Running tests" section to readme (Simon Ho)


2015-03-02, Version 1.5.1
=========================

 * Test if the id is generated (Raymond Feng)

 * add test case for id manipulation (Ido Shamun)

 * Add support for custom column mapping in primary key column Add support for idInjection (Ido Shamun)


2015-02-20, Version 1.5.0
=========================

 * Add support for custom column mapping (Raymond Feng)


2015-01-27, Version 1.4.0
=========================

 * Fix the empty column list (Raymond Feng)

 * Increase the limit to make sure other owners are selected (Raymond Feng)

 * Enhance id to pk mapping (Raymond Feng)

 * Fix: empty inq/nin function correctly (bitmage)


2015-01-09, Version 1.3.0
=========================

 * Fix SQL injection (Raymond Feng)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-12-08, Version 1.2.0
=========================

 * Update test dep (Raymond Feng)

 * Fix the missing var (Raymond Feng)

 * fixed race condition causing incorrect IDs to be reported on INSERT (bitmage)

 * handle precision and scale (bitmage)


2014-12-05, Version 1.1.6
=========================

 * Update deps (Raymond Feng)

 * Map required/id properties to NOT NULL (Raymond Feng)


2014-11-27, Version 1.1.5
=========================

 * Update README.md (Rand McKinney)

 * Add contribution guidelines (Ryan Graham)


2014-09-11, Version 1.1.4
=========================

 * Bump version (Raymond Feng)

 * Bump versions (Raymond Feng)

 * Make sure errors are reported for automigrate/autoupdate (Raymond Feng)


2014-08-25, Version 1.1.3
=========================

 * Bump version (Raymond Feng)

 * Remove ON[PRIMARY] option (Raymond Feng)


2014-08-20, Version 1.1.2
=========================

 * Bump version (Raymond Feng)

 * Add ping() (Raymond Feng)


2014-06-27, Version 1.1.1
=========================

 * Bump versions (Raymond Feng)

 * Tidy up filter.order parsing (Raymond Feng)

 * Update link to doc (Rand McKinney)

 * Bump version (Raymond Feng)


2014-06-23, Version 1.1.0
=========================

 * Use base connector and add update support (Raymond Feng)

 * Fix comparison for null/boolean values (Raymond Feng)

 * Updated to allow global replacement (Jason Douglas)

 * Update mssql.js to properly escape ' chars (Jason Douglas)

 * Remove 'module deps' from JSDocs (Rand McKinney)

 * Replace old README with link to docs and basic info. (Rand McKinney)

 * Create docs.json (Rand McKinney)


2014-05-16, Version 1.0.1
=========================

 * First release!
