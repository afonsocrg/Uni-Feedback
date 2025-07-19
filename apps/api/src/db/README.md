# Some notes about D1 and Drizzle

## Decision log / reasoning

### School year

The school year is stored as a single number, representing the year the school year started.
For example, the school year 2024/2025 is stored as 2024.

### Ratings

👉 Ratings range from 1 to 5, and **higher means better**, always!

Using "high means better" across the whole platform has some advantages:
 - **Reduces cognitive load** when comparing multiple metrics -
  If different metrics pointed in different directions, students would need to analyze the metric itself to understand if the rating is good or bad.
  This introduces cognitive load that decreases user experience.
  If every metric follows "higher is better", students don't really need to know if the metric should have a higher or lower rating: `"High number good, uga!"`
 - Easier to process and collect statistics
 - Easier to create cool charts and visualizations

This rule may present some challenges:
Certain metrics that naturally point in the direction of "lower is better" should be reframed in a way that follows the "higher is better" rule.

The "workload" metric is an example of this.
One could argue that a workload rating of 1 is good, because it means the course has a low workload.
To prevent this, we need to make sure the UI (especially the forms) is clear about what the numbers mean.
We should probably reframe "workload" as "Workload manageability", or "Schedule friendlyness".
We can also use labels near the rating scale to help the student understand what the numbers mean.

E.g.

```
Workload

[ ] 1 - Overwhelming! I lived in the library
[ ] 2
[ ] 3
[ ] 4
[ ] 5 - Manageable with plenty of time for other courses
```


### Storing author email in feedback table

One of the core principles of this platform is that feedback will always be anonymous!
However, it is important for us to store the email in the database, so that
 - We can reach out to the feedback author, if needed
 - The author can update/edit their feedback


## Connecting to databases

- We can use drizzle-kit to connect to a local or remote database.
- To connect to the local database, we can run `bun db`
- To connect to the remote production database, we can run `bun db-prod`

DBeaver would be a good option to connect to the database and run queries, change tables, etc. The problem is that since the database is SQLite, we would need to refresh the connection every time an external change is made to the database... Drizzle Studio automatically refreshes the connection.

## Backups
Getting a backup of local and remote databases (check package.json for more options)
```
bun backup
```

## Migrations

To create a new migration, run

```
bun drizzle-kit generate --name=<migration_name>
```

This will output a file in `src/db/migrations`.
The migration files should be version controlled!

To apply the migration in the local database, run

```
bun drizzle-kit migrate
```

Before applying the migration to the remote database, create a backup of the remote database, and start by testing the migration on a local copy of the remote database.
To apply the migration in the remote database, run

```
DB_REMOTE=true bun drizzle-kit migrate
```

## Executing SQL files

Locally:
```
$ bun wrangler d1 execute <database_name> --local --file <sql_file>
```

Remotely:
```
$ bun wrangler d1 execute <database_name> --remote --file <sql_file> -y
```

## How to test the remote database locally:

1. Make sure the local server is not running

2. Create a backup of the remote database
```
bun run backup
```

This will create a backup in the `backups` directory, with the current timestamp

3. Remove the local .wrangler/d1 directory
```
rm -rf .wrangler/state/v3/d1
```

4. Start the local server
```
bun run dev
```

5. Execute the SQL files
```
bun wrangler d1 execute meic-feedback --local --file <sql_file>
```
Where sql_file corresponds to the name of the SQL file in the `backups/remote` directory.

---

To restore the previous state of the database, you can repeat these steps starting from step 3, but on step 5, use the backup file that is in the `backups/local` directory


---

# Old notes

- Cloudflare does not support to run a local D1 instance unless we're using pages.
  However, it's possible to connect drizzle to a local sqlite instance by having the custom code in `drizzle.config.ts`.

- It's good to use the drizzle studio to connect and change the database. We can start the studio with `bun drizzle-kit studio`.

## Drizzle commands

```
npx drizzle-kit generate
```

This command lets us generate SQL migrations based on the Drizzle schema upon declaration or on subsequent schema changes.

---

```
npx drizzle-kit migrate
```

This command applies the current migrations to the database.

---

```
# https://orm.drizzle.team/docs/drizzle-kit-push
npx drizzle-kit push
```

This command gets the current database schema in use, compares it with the schema in `src/db/schema`, generates a migration and immediately runs it. It's good for development and prototyping, but not for production, as it may introduce errors in the database.

## Cloudflare D1 commands

```
bun wrangler d1 create <database_name>
```

This command creates a new database.

```
bun wrangler d1 info <database_name>
```

This command shows information about the database.

## Database Diagram

```
bun drizzle-kit studio
```

This command opens the Drizzle Studio, which is a visual interface for interacting with the database.
