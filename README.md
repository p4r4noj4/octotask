# Structure
Two main directories are client and server. The client folder consists of:

* __css__ directory for layout
* __router.js__ file with routing definitions
* __octotask.js__ and __octotask.html__ being the backbone of the rest of front-end
* __modules__ directory containing javascript and html files for all parts of
web

The .meteor directory is necessary, as it contains the needed definitions 
for meteor packages and database set-up.

The packages folder is used to provide the npm container, so that 
the system can use Node.js modules (defined in packages.json).

# Contributing 

## Indentation
* Project is developed under JetBrains IDEs
* Make sure you are using [JetBrains Codestyle](https://github.com/vucalur/JetBrains-Codestyle) to indent your code.
* Some files, file parts should not be formatted - check what you’re committing.
* **Warning:** The formatter tends to leave parts of CoffeeScript code unindented or screw CS indentation at all. Beware.
