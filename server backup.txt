const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(__dirname));
app.use(express.json({ limit: "10mb" }));

// Initialize SQLite database
const db = new sqlite3.Database("recipes.sqlite", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

// Create tables if they don't exist
function initializeDatabase() {
  db.serialize(() => {
    // Create main recipes table
    db.run(`
      CREATE TABLE IF NOT EXISTS recipes (
        recipeNumber INTEGER PRIMARY KEY,
        recipeName TEXT NOT NULL,
        recipeImage TEXT,
        recipeLocation TEXT,
        URLorBook TEXT,
        noteTextarea TEXT,
        otherTextarea TEXT
      )
    `);

    // Create labels table for many-to-many relationship
    db.run(`
      CREATE TABLE IF NOT EXISTS recipe_labels (
        recipeId INTEGER,
        label TEXT,
        FOREIGN KEY (recipeId) REFERENCES recipes(recipeNumber),
        PRIMARY KEY (recipeId, label)
      )
    `);

    // Create deleted_recipes table for backup
    db.run(`
      CREATE TABLE IF NOT EXISTS deleted_recipes (
        recipeNumber INTEGER PRIMARY KEY,
        recipeName TEXT NOT NULL,
        recipeImage TEXT,
        recipeLocation TEXT,
        URLorBook TEXT,
        noteTextarea TEXT,
        otherTextarea TEXT,
        deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// Find highest recipe number
async function findHighestRecipeNumber() {
  return new Promise((resolve, reject) => {
    db.get("SELECT MAX(recipeNumber) as maxNum FROM recipes", [], (err, row) => {
      if (err) {
        console.error("Error finding highest recipeNumber:", err);
        reject(err);
      } else {
        const highestRecipeNumber = row.maxNum || 0;
        const RecipeNumberNew = highestRecipeNumber + 1;
        console.log({ RecipeNumberNew }, { highestRecipeNumber });
        resolve(RecipeNumberNew);
      }
    });
  });
}

findHighestRecipeNumber()

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/sendRecipeToDBAPI", async (req, res) => {
  const requestData = req.body;
  const RecipeNumberNew = await findHighestRecipeNumber();

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO recipes (
        recipeNumber, recipeName, recipeImage, recipeLocation,
        URLorBook, noteTextarea, otherTextarea
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      RecipeNumberNew,
      requestData.recipeName,
      requestData.recipeImage,
      requestData.recipeLocation,
      requestData.URLorBook,
      requestData.noteTextarea,
      requestData.otherTextarea,
      function(err) {
        if (err) {
          console.error("Error inserting recipe:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Insert labels
        const labelStmt = db.prepare("INSERT INTO recipe_labels (recipeId, label) VALUES (?, ?)");
        requestData.labelsArray.forEach(label => {
          labelStmt.run(RecipeNumberNew, label);
        });
        labelStmt.finalize();

        res.status(200).json({ message: "Recipe data successfully added to the database" });
      }
    );
    stmt.finalize();
  });
});

app.post('/api/POSTFindSearchItems', (req, res) => {
  const searchString = req.body.labelsArray;
  if (!searchString) {
    //return res.status(400).json({ error: "Search string required" });
  }
  const searchTerms = searchString.trim().split(/\s+/);
  const placeholders = searchTerms.map(() => '?').join(' OR label LIKE ');
  const searchParams = searchTerms.map(term => `%${term}%`);

  const query = `
    SELECT DISTINCT r.*, GROUP_CONCAT(rl.label) as labelsArray
    FROM recipes r
    JOIN recipe_labels rl ON r.recipeNumber = rl.recipeId
    WHERE rl.label LIKE ${placeholders}
    GROUP BY r.recipeNumber
    ORDER BY r.recipeName ASC
  `;

  db.all(query, searchParams, (err, rows) => {
    if (err) {
      console.error('POSTFindSearchItems:', err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert labelsArray from string back to array
      const results = rows.map(row => ({
        ...row,
        labelsArray: row.labelsArray.split(',')
      }));
      res.json(results);
    }
  });
});

app.post("/api/replaceRecipeToDBAPI", async (req, res) => {
  const requestData = req.body;
  const recipeNumber = requestData.recipeNumber;

  db.serialize(() => {
    // Begin transaction
    db.run("BEGIN TRANSACTION");

    // Delete existing labels
    db.run("DELETE FROM recipe_labels WHERE recipeId = ?", [recipeNumber]);

    // Update recipe
    db.run(`
      UPDATE recipes SET
        recipeName = ?,
        recipeImage = ?,
        recipeLocation = ?,
        URLorBook = ?,
        noteTextarea = ?,
        otherTextarea = ?
      WHERE recipeNumber = ?
    `, [
      requestData.recipeName,
      requestData.recipeImage,
      requestData.recipeLocation,
      requestData.URLorBook,
      requestData.noteTextarea,
      requestData.otherTextarea,
      recipeNumber
    ], function(err) {
      if (err) {
        db.run("ROLLBACK");
        console.error("Error updating recipe:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Insert new labels
      const labelStmt = db.prepare("INSERT INTO recipe_labels (recipeId, label) VALUES (?, ?)");
      requestData.labelsArray.forEach(label => {
        labelStmt.run(recipeNumber, label);
      });
      labelStmt.finalize();

      // Commit transaction
      db.run("COMMIT", (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Internal Server Error" });
        }
        res.status(200).json({ message: "Recipe successfully updated" });
      });
    });
  });
});

app.post("/api/getRecipeNames", (req, res) => {
  db.all("SELECT recipeName FROM recipes ORDER BY recipeName ASC", [], (err, rows) => {
    if (err) {
      console.error('Error retrieving recipe names:', err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const recipeNames = rows.map(row => row.recipeName);
      res.json({ recipeNames });
    }
  });
});

// app.post("/api/deleteRecipe", (req, res) => {
//   const { recipeName } = req.body;
//   console.log(recipeName);

//   db.serialize(() => {
//     db.run("BEGIN TRANSACTION");

//     // First, get the recipe to be deleted
//     db.get("SELECT * FROM recipes WHERE recipeName = ?", [recipeName], (err, recipe) => {
//       if (err) {
//         db.run("ROLLBACK");
//         return res.status(500).json({ error: "Internal Server Error" });
//       }

//       if (!recipe) {
//         db.run("ROLLBACK");
//         return res.status(404).json({ error: "Recipe not found" });
//       }

//       // Insert into deleted_recipes
//       db.run(`
//         INSERT INTO deleted_recipes
//         SELECT *, CURRENT_TIMESTAMP
//         FROM recipes
//         WHERE recipeName = ?
//       `, [recipeName], function(err) {
//         if (err) {
//           db.run("ROLLBACK");
//           return res.status(500).json({ error: "Internal Server Error" });
//         }

//         // Delete from recipe_labels
//         db.run("DELETE FROM recipe_labels WHERE recipeId = ?", [recipe.recipeNumber], function(err) {
//           if (err) {
//             db.run("ROLLBACK");
//             return res.status(500).json({ error: "Internal Server Error" });
//           }

//           // Delete from recipes
//           db.run("DELETE FROM recipes WHERE recipeName = ?", [recipeName], function(err) {
//             if (err) {
//               db.run("ROLLBACK");
//               return res.status(500).json({ error: "Internal Server Error" });
//             }

//             db.run("COMMIT", (err) => {
//               if (err) {
//                 db.run("ROLLBACK");
//                 return res.status(500).json({ error: "Internal Server Error" });
//               }
//               res.status(200).json({ message: "Recipe successfully deleted and backed up" });
//             });
//           });
//         });
//       });
//     });
//   });
// });

app.post("/api/deleteRecipe", (req, res) => {
  const { recipeName } = req.body;
  console.log("Attempting to delete recipe:", recipeName);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        console.error("Transaction begin error:", err);
        return res.status(500).json({ error: "Failed to start transaction" });
      }

      // Delete from recipes table
      db.run(
        "DELETE FROM recipes WHERE recipeName = ?",
        [recipeName],
        function(err) {
          if (err) {
            console.error("Error deleting recipe:", err);
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Failed to delete recipe" });
          }

          // Check if any rows were actually deleted
          if (this.changes === 0) {
            db.run("ROLLBACK");
            return res.status(404).json({ error: "Recipe not found" });
          }

          // Commit the transaction if everything succeeded
          db.run("COMMIT", (err) => {
            if (err) {
              console.error("Commit error:", err);
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to commit transaction" });
            }
            
            res.json({ 
              message: "Recipe deleted successfully",
              recipeName: recipeName,
              rowsAffected: this.changes
            });
          });
        }
      );
    });
  });
});

app.get('/api/countRecipes', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM recipes", [], (err, row) => {
    if (err) {
      console.error("Error counting recipes:", err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json({ count: row.count });
    }
  });
});

app.get('/api/countMadeRecipes', (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT recipeId) as count
    FROM recipe_labels
    WHERE label LIKE '%to be made%'
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      console.error("Error counting 'to be made' recipes:", err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json({ count: row.count });
    }
  });
});

app.post('/api/TWUpdate', (req, res) => {
  const { recipeNumber } = req.body;

  if (!recipeNumber) {
    return res.status(400).json({ error: 'Recipe number is required' });
  }

  db.serialize(() => {
    // Check if "This Week" label exists
    db.get(
      "SELECT 1 FROM recipe_labels WHERE recipeId = ? AND label = 'This Week'",
      [recipeNumber],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const labelExists = !!row;

        if (labelExists) {
          // Remove the label
          db.run(
            "DELETE FROM recipe_labels WHERE recipeId = ? AND label = 'This Week'",
            [recipeNumber],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ success: true, message: '"This Week" label removed from labelsArray.' });
            }
          );
        } else {
          // Add the label
          db.run(
            "INSERT INTO recipe_labels (recipeId, label) VALUES (?, 'This Week')",
            [recipeNumber],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ success: true, message: '"This Week" label added to labelsArray.' });
            }
          );
        }
      }
    );
  });
});

app.post('/api/POSTFindSearchItemsThisWeek', (req, res) => {
  const searchString = req.body.labelsArray;

  const query = `
    SELECT r.*, GROUP_CONCAT(rl.label) as labelsArray
    FROM recipes r
    JOIN recipe_labels rl ON r.recipeNumber = rl.recipeId
    WHERE rl.label = ?
    GROUP BY r.recipeNumber
    ORDER BY r.recipeName ASC
  `;

  db.all(query, [searchString], (err, rows) => {
    if (err) {
      console.error('POSTFindSearchItemsThisWeek:', err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert labelsArray from string back to array
      const results = rows.map(row => ({
        ...row,
        labelsArray: row.labelsArray.split(',')
      }));
      res.json(results);
    }
  });
});

app.post('/api/POSTFindSearchItemsToBeMade', (req, res) => {
  const searchString = req.body.labelsArray;

  const query = `
    SELECT r.*, GROUP_CONCAT(rl.label) as labelsArray
    FROM recipes r
    JOIN recipe_labels rl ON r.recipeNumber = rl.recipeId
    WHERE rl.label LIKE ?
    GROUP BY r.recipeNumber
    ORDER BY r.recipeName ASC
  `;

  db.all(query, [`%${searchString}%`], (err, rows) => {
    if (err) {
      console.error('POSTFindSearchItemsToBeMade:', err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert labelsArray from string back to array
      const results = rows.map(row => ({
        ...row,
        labelsArray: row.labelsArray.split(',')
      }));
      res.json(results);
    }
  });
});

app.get("/api/getRecipes", (req, res) => {
  const query = `
    SELECT r.*, GROUP_CONCAT(rl.label) as labelsArray
    FROM recipes r
    LEFT JOIN recipe_labels rl ON r.recipeNumber = rl.recipeId
    GROUP BY r.recipeNumber
    ORDER BY r.recipeName ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error getting recipes:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert labelsArray from string back to array
      const results = rows.map(row => ({
        ...row,
        labelsArray: row.labelsArray ? row.labelsArray.split(',') : []
      }));
      res.json(results);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});