const Datastore = require('nedb');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize NeDB databases
const recipesDB = new Datastore({ filename: 'Recipes.db' });
const deletedDB = new Datastore({ filename: 'RecipesDeleted.db' });

// Initialize SQLite database
const db = new sqlite3.Database('recipes.sqlite');

// Load NeDB databases
recipesDB.loadDatabase();
deletedDB.loadDatabase();

// Create SQLite tables
function initializeSQLite() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop existing tables if they exist
      db.run("DROP TABLE IF EXISTS recipe_labels");
      db.run("DROP TABLE IF EXISTS deleted_recipes");
      db.run("DROP TABLE IF EXISTS recipes");

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

      // Create labels table
      db.run(`
        CREATE TABLE IF NOT EXISTS recipe_labels (
          recipeId INTEGER,
          label TEXT,
          FOREIGN KEY (recipeId) REFERENCES recipes(recipeNumber),
          PRIMARY KEY (recipeId, label)
        )
      `);

      // Create deleted_recipes table
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
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Function to fix duplicate recipe numbers
function fixDuplicateRecipeNumbers(recipes) {
  console.log('Checking for duplicate recipe numbers...');
  
  // Sort recipes by recipeNumber to ensure consistent ordering
  recipes.sort((a, b) => a.recipeNumber - b.recipeNumber);
  
  // Keep track of used recipe numbers
  const usedNumbers = new Set();
  let nextNumber = 1;
  
  // Fix duplicate recipe numbers
  const fixedRecipes = recipes.map(recipe => {
    if (!recipe.recipeNumber || usedNumbers.has(recipe.recipeNumber)) {
      // Find next available number
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      console.log(`Fixing duplicate/missing recipe number: Old=${recipe.recipeNumber}, New=${nextNumber}`);
      recipe.recipeNumber = nextNumber;
    }
    usedNumbers.add(recipe.recipeNumber);
    nextNumber = recipe.recipeNumber + 1;
    return recipe;
  });

  return fixedRecipes;
}

// Migrate active recipes
function migrateActiveRecipes() {
  return new Promise((resolve, reject) => {
    recipesDB.find({}).sort({ recipeNumber: 1 }).exec((err, recipes) => {
      if (err) {
        reject(err);
        return;
      }

      // Fix duplicate recipe numbers before migration
      const fixedRecipes = fixDuplicateRecipeNumbers(recipes);

      db.serialize(() => {
        // Begin transaction
        db.run("BEGIN TRANSACTION");

        const recipeStmt = db.prepare(`
          INSERT INTO recipes (
            recipeNumber, recipeName, recipeImage, recipeLocation,
            URLorBook, noteTextarea, otherTextarea
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const labelStmt = db.prepare(`
          INSERT INTO recipe_labels (recipeId, label)
          VALUES (?, ?)
        `);

        fixedRecipes.forEach(recipe => {
          try {
            // Insert recipe
            recipeStmt.run(
              recipe.recipeNumber,
              recipe.recipeName || '',
              recipe.recipeImage || '',
              recipe.recipeLocation || '',
              recipe.URLorBook || '',
              recipe.noteTextarea || '',
              recipe.otherTextarea || ''
            );

            // Insert labels
            if (Array.isArray(recipe.labelsArray)) {
              recipe.labelsArray.forEach(label => {
                if (label) {
                  labelStmt.run(recipe.recipeNumber, label);
                }
              });
            }
          } catch (error) {
            console.error(`Error processing recipe ${recipe.recipeNumber}:`, error);
          }
        });

        recipeStmt.finalize();
        labelStmt.finalize();

        // Commit transaction
        db.run("COMMIT", (err) => {
          if (err) {
            console.error("Error during commit:", err);
            db.run("ROLLBACK");
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Migrate deleted recipes
function migrateDeletedRecipes() {
  return new Promise((resolve, reject) => {
    deletedDB.find({}).sort({ recipeNumber: 1 }).exec((err, recipes) => {
      if (err) {
        reject(err);
        return;
      }

      // Fix duplicate recipe numbers for deleted recipes
      const fixedRecipes = fixDuplicateRecipeNumbers(recipes);

      db.serialize(() => {
        // Begin transaction
        db.run("BEGIN TRANSACTION");

        const stmt = db.prepare(`
          INSERT INTO deleted_recipes (
            recipeNumber, recipeName, recipeImage, recipeLocation,
            URLorBook, noteTextarea, otherTextarea
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        fixedRecipes.forEach(recipe => {
          try {
            stmt.run(
              recipe.recipeNumber,
              recipe.recipeName || '',
              recipe.recipeImage || '',
              recipe.recipeLocation || '',
              recipe.URLorBook || '',
              recipe.noteTextarea || '',
              recipe.otherTextarea || ''
            );
          } catch (error) {
            console.error(`Error processing deleted recipe ${recipe.recipeNumber}:`, error);
          }
        });

        stmt.finalize();

        // Commit transaction
        db.run("COMMIT", (err) => {
          if (err) {
            console.error("Error during commit:", err);
            db.run("ROLLBACK");
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Run the migration
async function migrate() {
  try {
    console.log('Initializing SQLite database...');
    await initializeSQLite();

    console.log('Migrating active recipes...');
    await migrateActiveRecipes();
    console.log('Active recipes migrated successfully.');

    console.log('Migrating deleted recipes...');
    await migrateDeletedRecipes();
    console.log('Deleted recipes migrated successfully.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

// Start migration
migrate();