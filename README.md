## loopback-connector-mssql

`loopback-connector-mssql` is the Microsoft SQL Server connector module for [loopback-datasource-juggler](https://github.com/strongloop/loopback-datasource-juggler/).

For complete documentation, see [StrongLoop Documentation | SQL Server Connector](http://docs.strongloop.com/display/LB/SQL+Server+connector).

## Installation

````sh
npm install loopback-connector-mssql --save
````

## Basic use

To use it you need `loopback-datasource-juggler`.

1. Setup dependencies in `package.json`:

    ```json
    {
      ...
      "dependencies": {
        "loopback-datasource-juggler": "latest",
        "loopback-connector-mssql": "latest"
      },
      ...
    }
    ```

2. Use:

    ```javascript
        var DataSource = require('loopback-datasource-juggler').DataSource;
        var dataSource = new DataSource('mssql', {
            host: 'demo.strongloop.com',
            port: 3306,
            database: 'mydb',
            username: 'myuser',
            password: 'mypass'
        });
    ```

