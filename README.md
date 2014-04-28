## loopback-connector-mssql

The Microsoft SQL Server (MSSQL) Connector module for for [loopback-datasource-juggler](http://docs.strongloop.com/loopback-datasource-juggler/).


## Connector settings

The connector can be configured using the following settings from the data source.

* host or hostname (default to 'localhost'): The host name or ip address of the Microsoft SQL Server
* port (default to 1433): The port number of the Microsoft SQL Server
* username or user: The user name to connect to the Microsoft SQL Server
* password: The password
* database: The Microsoft SQL Server database name
* schema: The database schema, default to 'dbo'

**NOTE**: By default, the 'dbo' schema is used for all tables.

The MSSQL connector uses [node-mssql](https://github.com/patriksimek/node-mssql) as the driver. See more
information about configuration parameters, check [https://github.com/patriksimek/node-mssql#configuration-1](https://github.com/patriksimek/node-mssql#configuration-1).

**NOTE**: The connector can also be configured using a single 'url' property,
for example:
```json
    {
        "url": "mssql://test:mypassword@localhost:1433/demo?schema=dbo"
    }
```

## Discovering Models

Microsoft SQL Server data sources allow you to discover model definition information from existing mssql databases. See the following APIs:

 - [dataSource.discoverModelDefinitions([username], fn)](https://github.com/strongloop/loopback#datasourcediscovermodeldefinitionsusername-fn)
 - [dataSource.discoverSchema([owner], name, fn)](https://github.com/strongloop/loopback#datasourcediscoverschemaowner-name-fn)


## Model definition for Microsoft SQL Server

The model definition consists of the following properties:

* name: Name of the model, by default, it's the camel case of the table
* options: Model level operations and mapping to Microsoft SQL Server schema/table
* properties: Property definitions, including mapping to Microsoft SQL Server columns

```json

    {"name": "Inventory", "options": {
      "idInjection": false,
      "mssql": {
        "schema": "strongloop",
        "table": "inventory"
      }
    }, "properties": {
      "id": {
        "type": "String",
        "required": false,
        "length": 64,
        "precision": null,
        "scale": null,
        "mssql": {
          "columnName": "id",
          "dataType": "varchar",
          "dataLength": 64,
          "dataPrecision": null,
          "dataScale": null,
          "nullable": "NO"
        }
      },
      "productId": {
        "type": "String",
        "required": false,
        "length": 64,
        "precision": null,
        "scale": null,
        "id": 1,
        "mssql": {
          "columnName": "product_id",
          "dataType": "varchar",
          "dataLength": 64,
          "dataPrecision": null,
          "dataScale": null,
          "nullable": "YES"
        }
      },
      "locationId": {
        "type": "String",
        "required": false,
        "length": 64,
        "precision": null,
        "scale": null,
        "id": 1,
        "mssql": {
          "columnName": "location_id",
          "dataType": "varchar",
          "dataLength": 64,
          "dataPrecision": null,
          "dataScale": null,
          "nullable": "YES"
        }
      },
      "available": {
        "type": "Number",
        "required": false,
        "length": null,
        "precision": 10,
        "scale": 0,
        "mssql": {
          "columnName": "available",
          "dataType": "int",
          "dataLength": null,
          "dataPrecision": 10,
          "dataScale": 0,
          "nullable": "YES"
        }
      },
      "total": {
        "type": "Number",
        "required": false,
        "length": null,
        "precision": 10,
        "scale": 0,
        "mssql": {
          "columnName": "total",
          "dataType": "int",
          "dataLength": null,
          "dataPrecision": 10,
          "dataScale": 0,
          "nullable": "YES"
        }
      }
    }}

```

## Type Mapping

 - Number
 - Boolean
 - String
 - Object
 - Date
 - Array
 - Buffer

### JSON to Microsoft SQL Server Types


### Microsoft SQL Server Types to JSON


## Destroying Models

Destroying models may result in errors due to foreign key integrity. Make sure
to delete any related models first before calling delete on model's with
relationships.

## Auto Migrate / Auto Update

After making changes to your model properties you must call `Model.automigrate()`
or `Model.autoupdate()`. Only call `Model.automigrate()` on new models
as it will drop existing tables.

LoopBack MSSQL connector creates the following schema objects for a given
model:

* A table, for example, PRODUCT under the 'dbo' schema within the database


## Running tests

    npm test
