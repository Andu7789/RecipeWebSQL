const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = process.env.PORT || 3001;
let recipeNumberDB = 1;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  findHighestRecipeNumber();
});

// Serve static files from the root directory
app.use(express.static(__dirname)); // Updated to serve static files from the root directory
app.use(express.json({ limit: "10mb" })); // Allow JSON to be used

// Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html")); // Updated to point to index.html in the root
});


// make a new database called database.db if it doesnt already exist
const database1 = new Datastore("Recipes.db");
database1.loadDatabase();
db1 = database1;

const databaseDeleted = new Datastore("RecipesDeleted.db");
databaseDeleted.loadDatabase();
dbDeleted = databaseDeleted;

let highestRecipeNumber;
let RecipeNumberNew;

function findHighestRecipeNumber() {
  // Use NeDB's find method to get the highest recipeNumber
  db1.find({}).sort({ recipeNumber: -1 }).limit(1).exec(function (err, docs) {
    if (err) {
      console.error("Error finding highest recipeNumber:", err);
      return;
    }

    if (docs.length > 0) {
      highestRecipeNumber = docs[0].recipeNumber;
      RecipeNumberNew = highestRecipeNumber + 1;
      console.log({ RecipeNumberNew }, { highestRecipeNumber });
      console.log("Highest RecipeNumber:", highestRecipeNumber);
    } else {
      console.log("No recipeNumbers found in the database.");
      RecipeNumberNew = 1;
      console.log({ RecipeNumberNew });
    }
  });
}


app.post("/api/sendRecipeToDBAPI", (request, response) => {
  const requestData = request.body;
  console.log("Received New Recipe Data", requestData,{RecipeNumberNew});
  const newRecipeData = {
    recipeNumber: RecipeNumberNew,
    recipeName: requestData.recipeName,
    labelsArray: requestData.labelsArray,
    recipeImage: requestData.recipeImage,
    recipeLocation: requestData.recipeLocation,
    URLorBook: requestData.URLorBook,
    noteTextarea: requestData.noteTextarea,
    otherTextarea: requestData.otherTextarea
  };
  console.log(newRecipeData);

  // Insert the document into the database
  db1.insert(newRecipeData, (err, newDoc) => {
    if (err) {
      console.error("Error inserting trade data into the database:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Recipe data inserted into the database:", newDoc);
      response.status(200).json({ message: "Recipe data successfully added to the database" });
    }
  });
  RecipeNumberNew++;
});

app.post('/api/POSTFindSearchItems', (request, response) => {

  let searchString = request.body.labelsArray; // Get search string from request
  if (!searchString) {
      // handle missing title error
  }
  const titles = searchString.trim().split(/\s+/); // Split into array by whitespace

  // Construct a single regex for all titles
  const regexPattern = titles.map(labelsArray => escapeRegExp(labelsArray)).join("|");
  const regex = new RegExp(regexPattern, "i"); // Case-insensitive

  db1.find({ labelsArray: { $regex: regex } })
    .sort({recipeName: 1}) // Sort by recipeName in alphabetical order
    .exec(function (err, docs) {
    if (err) {
      console.error('POSTFindSearchItems:', err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log('POSTFindSearchItems: Success');
      response.json(docs);
    }
  });
});


// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

app.post("/api/replaceRecipeToDBAPI", (request, response) => {
  const requestData = request.body;
  const recipeNumber = requestData.recipeNumber;
  // First delete the document from the database
  db1.remove({ recipeNumber: recipeNumber }, {}, (err, numRemoved) => {
    if (err) {
      console.error("Error deleting recipe data from the database:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Recipe data deleted from the database:", numRemoved);
      // Insert the new document into the database
      const newRecipeData = {
        recipeNumber: requestData.recipeNumber,
        recipeName: requestData.recipeName,
        labelsArray: requestData.labelsArray,
        recipeImage: requestData.recipeImage,
        recipeLocation: requestData.recipeLocation,
        URLorBook: requestData.URLorBook,
        noteTextarea: requestData.noteTextarea,
        otherTextarea: requestData.otherTextarea  
      };
      console.log(newRecipeData);
      db1.insert(newRecipeData, (err, newDoc) => {
        if (err) {
          console.error("Error inserting new recipe data into the database:", err);
          response.status(500).json({ error: "Internal Server Error" });
        } else {
          console.log("New recipe data inserted into the database:", newDoc);
          response.status(200).json({ message: "Recipe data successfully replaced in the database" });
        }
      });
      recipeNumberDB++;
    }
  });
});

app.post("/api/getRecipeNames", (request, response) => {
  db1.find({}, (err, docs) => {
    if (err) {
      console.error('Error retrieving data from the database:', err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      const recipeNames = docs.map(doc => doc.recipeName);
      response.json({ recipeNames });
    }
  });
});

app.post("/api/deleteRecipe", (request, response) => {
  const { recipeName } = request.body;

  // First, find the document to delete
  db1.findOne({ recipeName }, (err, doc) => {
    if (err) {
      console.error("Error finding recipe data in the database:", err);
      return response.status(500).json({ error: "Internal Server Error" });
    }

    if (!doc) {
      return response.status(404).json({ error: "Recipe not found" });
    }

    // Store the document in the backup database
    dbDeleted.insert(doc, (insertErr, newDoc) => {
      if (insertErr) {
        console.error("Error storing recipe data in the backup database:", insertErr);
        return response.status(500).json({ error: "Internal Server Error" });
      }

      // After storing the document, remove it from the original database
      db1.remove({ recipeName }, {}, (removeErr, numRemoved) => {
        if (removeErr) {
          console.error("Error deleting recipe data from the database:", removeErr);
          return response.status(500).json({ error: "Internal Server Error" });
        }

        console.log("Recipe data deleted from the database:", numRemoved);
        response.status(200).json({ message: "Recipe data successfully deleted and backed up" });
      });
    });
  });
});

  app.get('/api/countRecipes', (req, res) => {
    db1.count({}, function (err, count) {
      if (err) {
        console.error("Error finding highest recipeNumber:", err);
        res.status(500).json({ error: "Database error" });
      } else {
        res.json({ count });
      }
    });
  });

  // Function to count recipes where labelsArray contains the word 'made'
  function countRecipesWithMade() {
    return new Promise((resolve, reject) => {
      // Perform a case-insensitive search using a regular expression
      const caseInsensitiveRegex = new RegExp('to be made', 'i');
  
      // Find all documents matching the case-insensitive search
      db1.find({ labelsArray: caseInsensitiveRegex }, function (err, docs) {
        if (err) {
          console.error("Error finding recipes with 'made':", err);
          reject(err);
        } else {
          // Log each document that matches the criteria
          //console.log("Matched Documents:");
          //docs.forEach(doc => console.log(doc));
  
          // Count the number of matching documents
          const count = docs.length;
          resolve(count);
        }
      });
    });
  }
  
  // Express route to expose this count
  app.get('/api/countMadeRecipes', async (req, res) => {
    try {
      const count = await countRecipesWithMade();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Database error, could not count recipes containing (made)" });
    }
  });
  
  

app.post('/api/TWUpdate', (req, res) => {
  const { recipeNumber } = req.body;

  if (!recipeNumber) {
    return res.status(400).json({ error: 'Recipe number is required' });
  }

  // Find the recipe by recipeNumber
  db1.findOne({ recipeNumber: recipeNumber }, (err, recipe) => {
    if (err) {
      console.error('Error finding recipe:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const labelExists = recipe.labelsArray.includes('This Week');
    console.log({labelExists});


    // Update the labelsArray depending on whether "This Week" is already there
    const updateOperation = labelExists
      ? { $pull: { labelsArray: 'This Week' } } // Remove "This Week" if it exists
      : { $addToSet: { labelsArray: 'This Week' } }; // Add "This Week" if it doesn't exist

    db1.update(
      { recipeNumber: recipeNumber },
      updateOperation,
      {},
      (err, numAffected) => {
        if (err) {
          console.error('Error updating recipe:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (numAffected === 0) {
          return res.status(404).json({ error: 'Recipe not found' });
        }

        const action = labelExists ? 'removed from' : 'added to';
        console.log(`"This Week" label ${action} recipe ${recipeNumber}`);
        res.json({ success: true, message: `Recipe updated successfully. "This Week" label ${action} labelsArray.` });
      }
    );
  });
});

app.post('/api/POSTFindSearchItems', (req, res) => {
  const searchString = req.body.labelsArray;
  if (!searchString) {
    console.error('Error search String is empty:', err);
  }
  db1.find( {labelsArray: searchString  }, function (err, docs) {
    if (err) {
      console.error('POSTFindSearchItemsThisWeek:', err);
      response.status(500).json({ error: "POSTFindSearchItemsThisWeek ERROR" });
    } else {
      console.log('POSTFindSearchItemsThisWeek: Success');
      response.json(docs);
    }
  });
});

app.post('/api/POSTFindSearchItemsToBeMade', (request, response) => {
  let searchString = request.body.labelsArray; // Get search string from request
  console.log('POSTFindSearchItemsToBeMade:', searchString);

  if (!searchString) {
    console.error('Error: Search string is empty');
    return response.status(400).json({ error: "Search string is required" });
  }

  // Create a case-insensitive regular expression from the search string
  const caseInsensitiveRegex = new RegExp(searchString, 'i');

  db1.find({ labelsArray: caseInsensitiveRegex }, function (err, docs) {
    if (err) {
      console.error('POSTFindSearchItemsToBeMade:', err);
      response.status(500).json({ error: "POSTFindSearchItemsToBeMade ERROR" });
    } else {
      console.log('POSTFindSearchItemsToBeMade: Success');
      response.json(docs);
    }
  });
});

app.get("/api/getRecipes", (req, res) => {
  db1
    .find({})
    .sort({ recipeName: 1 })
    .exec((err, items) => {
      if (err) {
        console.error("getTradesAPI:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("getTradesAPI: Success");
        res.json(items);
      }
    });
});

app.get("/api/getTotalNUmberofRAPI", (req, res) => {
  db1.find({}, (err, documents) => {
    if (err) {
      console.error("getTotalNUmberofRAPI:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    try {
      let sumRRActual = 0;
      // Loop through the documents and accumulate the values of RRActual
      for (const trade of documents) {
        // Convert RRActual to a number and add it to the sum
        sumRRActual += Number(trade.RRActual);
      }

      console.log("Sum of RRActual:", sumRRActual);
      res.json(sumRRActual);
    } catch (error) {
      console.error("getTotalNUmberofRAPI:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

app.post("/api/getindividualTradeDataAPI", (request, response) => {
  const requestData = request.body;

  db1.find({ tradeNumber: requestData.tradeNumber }, function (err, trade) {
    if (err) {
      console.error("getindividualTradeDataAPI:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("getindividualTradeDataAPI: Success");
      if (trade && trade.length > 0) {
        response.json(trade[0]); // Assuming you only want to send the first result
      } else {
        response.status(404).json({ error: "Trade not found" });
      }
    }
  });
});

app.post("/api/updateTradeDataAPI", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);

  // Extract fields to update
  const {
    tradeNumber,
    OPT,
    pair,
    RRPlanned,
    RRActual,
    entryAsPerPlan,
    exitAsPerPlan,
    entryNotToPlan,
    exitNotToPlan,
  } = requestData;

  // Create an object with only the fields to update
  const updateFields = {
    OPT,
    pair,
    RRPlanned,
    RRActual,
    entryAsPerPlan,
    exitAsPerPlan,
    entryNotToPlan,
    exitNotToPlan,
  };

  db1.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: updateFields },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("Trade data updated successfully. Number of records updated:", numReplaced);

        // Fetch all rows after the update and return them in the response
        db1.find({}, (err, allRows) => {
          if (err) {
            console.error("Error fetching all rows:", err);
            response.status(500).json({ error: "Internal Server Error" });
          } else {
            console.log("All rows fetched successfully:");
            response.json(allRows);
          }
        });
      }
    }
  );
});

app.post("/api/updateEntryImgAPI", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    imgEntry: requestData.imgEntry,
    entryFilename: requestData.entryFilename,
  };
  console.log(newTradeData);
  db1.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:zzzzzzzz",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

const database2 = new Datastore("database2.db");
database2.loadDatabase();
db2 = database2;

const database3 = new Datastore("database3.db");
database3.loadDatabase();
Live = database3;

let selectedDatabase = database2;
app.post("/api/test", (req, res) => {
  const mode = req.body.mode;

  // Use the mode to determine the database to use for API calls

  if (mode === "Dev") {
    db2 = database2;
  } else if (mode === "Live") {
    db2 = database3;
  }
  console.log(db2);
});

///////////////////////////////////





app.post("/api/sendTradeDataToDBAPINEW", (request, response) => {
  const requestData = request.body;
  const missed = request.body.MissedTrade
  //console.log("Received job title to find:", requestData);
  console.log({ tradeNumberNew }, { highestTradeNumber });
  const newTradeData = {
    DXYEntryComment: requestData.DXYEntryComment,
    tradeNumber: tradeNumberNew,
    date: requestData.date,
    DXYimgEntry: requestData.DXYimgEntry,
    ALL4imgEntry: requestData.ALL4imgEntry,
    PairimgEntry: requestData.PairimgEntry,
    DXYEntryComment: requestData.DXYEntryComment,
    ALL4EntryComment: requestData.ALL4EntryComment,
    GJEntryComment: requestData.GJEntryComment,
    PairEntryComment: requestData.PairEntryComment,
    DXYEntryRadio: requestData.DXYEntryRadio,
    ALL4EntryRadio: requestData.ALL4EntryRadio,
    PairEntryRadio: requestData.PairEntryRadio,
    PairRadio: requestData.PairRadio,
    MissedTrade: requestData.MissedTrade,
  };
  console.log({ missed });
  db2.insert(newTradeData, (err, newDoc) => {
    if (err) {
      console.error("Error inserting trade data into the database:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Trade data inserted into the database:");
      response.status(200).json({ message: "Trade data successfully added to the database" });
    }
  });
  tradeNumberNew++;
});

app.get("/api/getTradesAPINEWJPY", (request, response) => {
  db2
    .find({})
    .sort({ tradeNumber: -1 })
    .exec((err, records) => {
      if (err) {
        console.error("getTradesAPINEWJPY:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("getTradesAPINEWJPY: Success");
        response.json(records);
      }
    });
});

app.post("/api/getindividualTradeDataAPIJPY", (request, response) => {
  const requestData = request.body;

  db2.find({ tradeNumber: requestData.tradeNumber }, function (err, trade) {
    if (err) {
      console.error("getindividualTradeDataAPIJPY:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("getindividualTradeDataAPIJPY: Success");
      if (trade && trade.length > 0) {
        response.json(trade[0]); // Assuming you only want to send the first result
      } else {
        response.status(404).json({ error: "Trade not found" });
      }
    }
  });
});

app.post("/api/GJUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    GJRRPlannedValue: requestData.GJRRPlannedValue,
    GJRRActualValue: requestData.GJRRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GJRRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/PairUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    PairRRPlannedValue: requestData.PairRRPlannedValue,
    PairRRActualValue: requestData.PairRRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:PairRRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/PairUpdateDateValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    date: requestData.date,
  };
  console.log({newTradeData});
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated: PairUpdateDateValues",
          numReplaced
        );
        response.json("date updated for record");
      }
    }
  );
});

app.post("/api/GJUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    GJOPTRadio: requestData.GJOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GJOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/PairUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    PairOPTRadio: requestData.PairOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:PairOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/DXYUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: DXYExit", requestData.tradeNumber);
  const newTradeData = {
    DXYimgExit: requestData.DXYimgExit,
    DXYExitComment: requestData.DXYExitComment,
    DXYExitRadio: requestData.DXYExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:DXYEXIT",
          numReplaced
        );
        response.json("Exit Img updated for AUDJPY record");
      }
    }
  );
});

app.post("/api/ALL4UpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: ALL4Exit", requestData.tradeNumber);
  const newTradeData = {
    ALL4imgExit: requestData.ALL4imgExit,
    ALL4ExitComment: requestData.ALL4ExitComment,
    ALL4ExitRadio: requestData.ALL4ExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:ALL4EXIT",
          numReplaced
        );
        response.json("Exit Img updated for EURJPY record");
      }
    }
  );
});

app.post("/api/GJUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: GJExit", requestData.tradeNumber);
  const newTradeData = {
    GJimgExit: requestData.GJimgExit,
    GJExitComment: requestData.GJExitComment,
    GJExitRadio: requestData.GJExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GJEXIT",
          numReplaced
        );
        response.json("Exit Img updated for GBPJPY record");
      }
    }
  );
});

app.post("/api/PairUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: PairExit", requestData.tradeNumber);
  const newTradeData = {
    PairimgExit: requestData.PairimgExit,
    PairExitComment: requestData.PairExitComment,
    PairExitRadio: requestData.PairExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:PairEXIT",
          numReplaced
        );
        response.json("Exit Img updated for AUDJPY record");
      }
    }
  );
});

//////////////////////////////////////

app.post("/api/sendTradeDataToDBAPINEWUSD", (request, response) => {
  const requestData = request.body;
  //console.log("Received job title to find:", requestData);
  console.log({ tradeNumberNew }, { highestTradeNumber });
  const newTradeData = {
    tradeNumber: tradeNumberNew,
    date: requestData.date,
    DXYComment: requestData.DXYComment,
    DXYImgeEntry: requestData.DXYImgeEntry,
    AUimgEntry: requestData.AUimgEntry,
    EUimgEntry: requestData.EUimgEntry,
    GBimgEntry: requestData.GBimgEntry,
    NZimgEntry: requestData.NZimgEntry,
    AUEntryComment: requestData.AUEntryComment,
    EUEntryComment: requestData.EUEntryComment,
    GBEntryComment: requestData.GBEntryComment,
    NZEntryComment: requestData.NZEntryComment,
    AUEntryRadio: requestData.AUEntryRadio,
    EUEntryRadio: requestData.EUEntryRadio,
    GBEntryRadio: requestData.GBEntryRadio,
    NZEntryRadio: requestData.NZEntryRadio,
  };

  db2.insert(newTradeData, (err, newDoc) => {
    if (err) {
      console.error("Error inserting trade data into the database:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Trade data inserted into the database:");
      response.status(200).json({ message: "Trade data successfully added to the database" });
    }
  });
  tradeNumberNew++;
});

app.get("/api/getTradesAPINEWUSD", (request, response) => {
  db2
    .find({})
    .sort({ tradeNumber: -1 })
    .exec((err, records) => {
      if (err) {
        console.error("getTradesAPINEWUSD:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("getTradesAPINEWUSD: Success");
        response.json(records);
      }
    });
});

app.post("/api/getindividualTradeDataAPIUSD", (request, response) => {
  const requestData = request.body;
  console.log(requestData);

  db2.find({ tradeNumber: requestData.tradeNumber }, function (err, trade) {
    if (err) {
      console.error("getindividualTradeDataAPIUSD:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("getindividualTradeDataAPIUSD: Success", trade.length);
      if (trade && trade.length > 0) {
        response.json(trade[0]); // Assuming you only want to send the first result
      } else {
        response.status(404).json({ error: "Trade not found" });
      }
    }
  });
});

app.post("/api/AUUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    AURRPlannedValue: requestData.AURRPlannedValue,
    AURRActualValue: requestData.AURRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:AURRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/EUUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    EURRPlannedValue: requestData.EURRPlannedValue,
    EURRActualValue: requestData.EURRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:EURRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/GBUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    GBRRPlannedValue: requestData.GBRRPlannedValue,
    GBRRActualValue: requestData.GBRRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GBRRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/NZUpdateRRValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    NZRRPlannedValue: requestData.NZRRPlannedValue,
    NZRRActualValue: requestData.NZRRActualValue,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:NZRRVALUES",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/AUUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    AUOPTRadio: requestData.AUOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:AUOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/EUUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    EUOPTRadio: requestData.EUOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:EUOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/GBUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    GBOPTRadio: requestData.GBOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GBOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/NZUpdateOPTValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update:", requestData.tradeNumber);
  const newTradeData = {
    NZOPTRadio: requestData.NZOPTRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:NZOPT",
          numReplaced
        );
        response.json("Entry Img updated for record");
      }
    }
  );
});

app.post("/api/AUUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: AUExit", requestData.tradeNumber);
  const newTradeData = {
    AUimgExit: requestData.AUimgExit,
    AUExitComment: requestData.AUExitComment,
    AUExitRadio: requestData.AUExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:AUEXIT",
          numReplaced
        );
        response.json("Exit Img updated for AUDJPY record");
      }
    }
  );
});

app.post("/api/EUUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: EUExit", requestData.tradeNumber);
  const newTradeData = {
    EUimgExit: requestData.EUimgExit,
    EUExitComment: requestData.EUExitComment,
    EUExitRadio: requestData.EUExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:EUEXIT",
          numReplaced
        );
        response.json("Exit Img updated for EURJPY record");
      }
    }
  );
});

app.post("/api/GBUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: GBExit", requestData.tradeNumber);
  const newTradeData = {
    GBimgExit: requestData.GBimgExit,
    GBExitComment: requestData.GBExitComment,
    GBExitRadio: requestData.GBExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:GBEXIT",
          numReplaced
        );
        response.json("Exit Img updated for GBPJPY record");
      }
    }
  );
});

app.post("/api/NZUpdateExitValues", (request, response) => {
  const requestData = request.body;
  console.log("Received trade number to update: NZExit", requestData.tradeNumber);
  const newTradeData = {
    NZimgExit: requestData.NZimgExit,
    NZExitComment: requestData.NZExitComment,
    NZExitRadio: requestData.NZExitRadio,
  };
  console.log(newTradeData);
  db2.update(
    { tradeNumber: requestData.tradeNumber },
    { $set: newTradeData },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("Error updating trade data:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log(
          "Trade data updated successfully. Number of records updated:NZEXIT",
          numReplaced
        );
        response.json("Exit Img updated for AUDJPY record");
      }
    }
  );
});

app.post("/api/getTradesDateLastWeekAPI", (request, response) => {
  const requestData = request.body;

  const datesforSearch = {
    dateStart: requestData.dateStart,
    dateEnd: requestData.dateEnd,
  };

  console.log(requestData);
  console.log(datesforSearch);
  db2
    .find({
      date: {
        $gte: datesforSearch.dateStart, // Greater than or equal to dateStart
        $lte: datesforSearch.dateEnd, // Less than or equal to dateEnd
      },
    })
    .sort({ date: -1, tradeNumber: -1 })
    .exec(function (err, trades) {
      if (err) {
        console.error("getTradesDateLastWeekAPxxxxx:", err);
        response.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("getTradesDateLastWeekAPIxxxx: Success");
        if (trades && trades.length > 0) {
          response.json(trades);
        } else {
          response.status(404).json({ error: "Trades not found for the specified date range" });
        }
      }
    });
});

app.post("/api/getTradesDateOneAPI", (request, response) => {
  const requestData = request.body;
  console.log(requestData);
  db2.find({ date: requestData.date }, function (err, trade) {
    if (err) {
      console.error("getTradesDateOneAPI:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("getTradesDateOneAPI: Success");
      if (trade && trade.length > 0) {
        response.json(trade);
      } else {
        response.status(404).json({ error: "Trade not found" });
      }
    }
  });
});

app.post("/api/updateFavAPI", (request, response) => {
  const requestData = request.body;

  const newTradeData = {
    fav: requestData.fav,
  };
  console.log(newTradeData);
  db2.update({ tradeNumber: requestData.tradeNumber }, { $set: newTradeData }, {}, (err, fav) => {
    if (err) {
      console.error("Error updating trade data:", err);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Trade data updated successfully. Fav value", fav);
      response.status(200).json({ fav: newTradeData.fav });
    }
  });
});

app.post("/api/deleteTradeAPI", (request, response) => {
  const requestData = request.body;

  const filter = {
    tradeNumber: requestData.tradeNumber,
  };

  db2.remove(filter, (deleteErr, deleteResult) => {
    if (deleteErr) {
      console.error("Error deleting trade data:", deleteErr);
      response.status(500).json({ error: "Internal Server Error" });
    } else {
        console.log("Trade data deleted successfully.");
    }
        // Fetch all remaining rows after deletion
        db2
        .find({})
        .sort({ tradeNumber: -1 })
        .exec((err, items) => {
          if (err) {
            console.error("Error fetching remaining trade data:", err);
            response.status(500).json({ error: "Internal Server Error" });
          } else {
            response.status(200).json(items);
          }
        });  
  });
});


app.get("/api/getFavsAPI", (req, res) => {
  db2
    .find({ fav: true })
    .sort({ date: -1 })
    .exec((err, items) => {
      if (err) {
        console.error("getFavsAPI:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("getFavsAPI: Success");
        res.json(items);
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