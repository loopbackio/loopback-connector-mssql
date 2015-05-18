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
