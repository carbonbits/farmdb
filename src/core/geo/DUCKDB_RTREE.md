# DuckDB version and the geospatial R-tree

## What this is about
The geospatial store keeps farm geometry in DuckDB with the spatial extension.
The geospatial table has an R-tree index on the geometry column for fast area
searches. Every write (create, update, delete) makes DuckDB maintain that index.

## The problem we hit
DuckDB 1.5.x crashes when it maintains the R-tree index. We saw two separate
crashes, both reported as "Operation requires a flat vector but a non-flat
vector was encountered" from inside the spatial extension.

1. Direct write crash (1.5.3 and 1.5.4). Inserting a geometry into a table that
   has the R-tree index crashes during the write itself.
2. Replay crash (all of 1.5.0 through 1.5.5). When a write is left in the write
   ahead log (the WAL, where DuckDB stages changes before folding them into the
   main file) and the process restarts, the next index operation replays those
   staged R-tree changes and crashes.

The replay crash is the dangerous one because it is silent until a restart.
Writes look like they succeed while the server is up, then the first index
operation after a restart brings the whole thing down.

## What we tested
We isolated each path and ran it against several versions. Insert plus
checkpoint tests the direct write path. Write without checkpoint, then reopen
and operate, tests the replay path.

| version | direct write | replay after restart |
| ------- | ------------ | -------------------- |
| 1.4.3   | ok           | ok                   |
| 1.4.5   | ok           | ok                   |
| 1.5.0   | ok           | crash                |
| 1.5.1   | ok           | crash                |
| 1.5.2   | ok           | crash                |
| 1.5.3   | crash        | crash                |
| 1.5.4   | crash        | crash                |
| 1.5.5   | ok           | crash                |

The 1.4 line is correct on both paths. The whole 1.5 line is broken on replay,
and the middle of it is broken on direct writes too.

## The decision
Pin DuckDB to the 1.4 line: `duckdb>=1.4.3,<1.5.0`. This keeps the floor the
team already set and excludes the entire 1.5 line, which is unsafe for our
R-tree usage. The lock currently resolves to 1.4.5.

We keep the R-tree index. It was added on purpose for area searches, and the fix
is to run a DuckDB version that maintains it correctly, not to drop the index.

## Storage compatibility
DuckDB 1.4.5 can open a database file that 1.5.x wrote, so the base storage
format is compatible. The R-tree index itself may have changed format in the
1.5.0 rewrite, so any environment that already ran 1.5.x should recreate the
index after moving to 1.4.x (drop and recreate the R-tree, which DuckDB rebuilds
from the geometry column). Development databases are rebuilt from migrations, so
this only matters where 1.5.x data already exists.

## How to re-test before changing the pin
Do not raise the ceiling without testing the replay path on the candidate
version. The repro that matters is: write a geometry into a table with an R-tree
index, do not checkpoint, end the process, reopen, then run an index operation.
If it does not crash, the version is a candidate. The insert plus checkpoint test
alone is not enough, because it hides the replay bug.

## Related
The constraint and a one line reason live in pyproject.toml. The draw and delete
features that surfaced this are in the map feature under the web app and the geo
feature on the api.
