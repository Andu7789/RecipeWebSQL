// const e = require("express");

let recipeImage = null;
let recipeNumberID =0
let labelsArray = [];
const labelName = ""
let count = 1
let recipeImageURL = null;
var thisweekbtnclicked = false

const recipeCardsContainer = document.getElementById("containerRecipesCards");
const containerRecipesCardsError = document.getElementById("containerRecipesCardsError");
const containerRecipesDeleteError = document.getElementById("containerRecipesDeleteError");
const containerRecipesCardsDelete = document.getElementById("containerRecipesCardsDelete");
const containerSearch = document.getElementById("containerSearch");
const containerAddRecipeDetails = document.getElementById("containerAddRecipeDetails");

const test = document.getElementById("test");

const otherBtn = document.getElementById('otherBtn');
otherBtn.addEventListener('click', () => {
  document.getElementById('otherInputs').classList.remove('d-none');
  document.getElementById('urlandnoteInputs').classList.add('d-none');
});

const websiteBtn = document.getElementById('websiteBtn');
websiteBtn.addEventListener('click', () => {
  document.getElementById('otherInputs').classList.add('d-none');
  document.getElementById('urlandnoteInputs').classList.remove('d-none');
});

const bookBtn = document.getElementById('bookBtn');
bookBtn.addEventListener('click', () => {
  document.getElementById('otherInputs').classList.add('d-none');
  document.getElementById('urlandnoteInputs').classList.remove('d-none');
});


//document.getElementById("recipeImage").addEventListener("change", recipeImageUpload);

function recipeImageUpload(event) {
  const fileInput = event.target;
  const files = fileInput.files;
  document.getElementById("recipeImageDiv").innerHTML = "";

  for (const file of files) {
    if (file.type.startsWith("image/")) {

      // Create a new FileReader
      const reader = new FileReader();

      // Closure to capture the file information
      reader.onload = (function (uploadedFile) {
        return function (e) {
          // Create an image element
          const img = document.createElement("img");
          img.className = "uploaded-image";
          img.src = e.target.result;

          recipeImage = e.target.result;

          img.addEventListener("click", function () {
            enlargeImage(img);
          });

          // Append the image to the image grid
          document.getElementById("recipeImageDiv").appendChild(img);
        };
      })(file);

      // Read in the image file as a data URL
      reader.readAsDataURL(file);
    }
  }
}



document.getElementById('recipeImage').addEventListener('change', function(event) {
    event.preventDefault();

    document.getElementById("recipeImageDiv").innerHTML = "";
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'recipe');  // Replace with your Upload Preset name

    // Cloudinary URL for upload
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dbaqbbsge/image/upload';

    fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Display uploaded image preview
        const preview = document.getElementById('recipeImageDiv');
        const img = document.createElement('img');
        img.src = data.secure_url;
        img.alt = 'Uploaded Image';
        preview.innerHTML = '';
        preview.appendChild(img);

        recipeImageURL = data.secure_url

        // Optional: Log the image URL for use elsewhere
        console.log('Image URL:', data.secure_url);
    })
    .catch(error => {
        console.error('Error uploading image:', error);
    });
});





function enlargeImage(img) {
  // Create a container for the enlarged image
  const enlargedContainer = document.createElement("div");
  enlargedContainer.className = "enlarged-image";

  // Clone the clicked image
  const enlargedImg = img.cloneNode(true);

  // Append the cloned image to the container
  enlargedContainer.appendChild(enlargedImg);

  // Append the container to the body
  document.body.appendChild(enlargedContainer);

  // Add a click event listener to close the enlarged image
  enlargedContainer.addEventListener("click", function () {
    document.body.removeChild(enlargedContainer);
  });
}

// Get a reference to the input element
const recipeNameInput = document.getElementById("recipeName");
let recipeName = ""

// Add an event listener to the input (e.g., when the user types or pastes)
recipeNameInput.addEventListener("input", () => {
    // Get the current value of the input
    recipeName = recipeNameInput.value;  

});

// Get a reference to the input element
const URLorBookInput = document.getElementById("URLorBook");
let URLorBook = ""

// Add an event listener to the input (e.g., when the user types or pastes)
URLorBookInput.addEventListener("input", () => {
    // Get the current value of the input
    URLorBook = URLorBookInput.value;
});

const labelListInput = document.getElementById("labelList");
let labelList = ""

// Add an event listener to the input (e.g., when the user types or pastes)
labelListInput.addEventListener("input", () => {
    // Get the current value of the input
    labelList = labelListInput.value;
});

const addLabelButton = document.getElementById("addLabelBtn");
const errorMessageElement = document.getElementById("errorMessage"); 



addLabelButton.addEventListener("click", addLabelToArray);

labelListInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addLabelToArray(); 
  }
});
function addLabelToArray() {

  const labelName = labelListInput.value.trim();
  labelsArray.push(labelName);
  labelListInput.value = "";
  errorMessageElement.textContent = "";


    // Check for empty input (after trimming)
    if (labelName === "") {
      errorMessageElement.textContent = "Please enter a label";
      errorMessageElement.style.display = "block"; // Show the error message
      return; // Stop the function if input is empty
    } else {
      errorMessageElement.style.display = "none"; // Hide any previous error messages
    }


  const labelsContainer = document.getElementById("labelsContainer")

  const mainDiv = document.createElement("div");
  mainDiv.classList.add("card", "borderdark","mb-2");
  mainDiv.style.border = "2px solid ";
  mainDiv.style.marginRight = "auto"; // Right-align the element


  const labelDiv = document.createElement("div");
  labelDiv.classList.add("card");
  labelDiv.style.display = "flex";
  labelDiv.textContent = labelName

  const deleeteDiv = document.createElement("div");
  deleeteDiv.textContent = "X";
  deleeteDiv.classList.add("hover");
  deleeteDiv.style.color = "red";
  mainDiv.appendChild(labelDiv);
  mainDiv.appendChild(deleeteDiv);


  deleeteDiv.addEventListener("click", () => {
   const labelToRemove = deleeteDiv.parentElement
   const indexToRemove = labelsArray.indexOf(labelName);
 
   if (indexToRemove > -1) {
    labelsArray.splice(indexToRemove, 1); // Remove label from the array
    labelToRemove.remove(); // Remove the label from the DOM
    
}
  });
    mainDiv.appendChild(deleeteDiv);
    labelsContainer.appendChild(mainDiv)
}



function clearInputs (){

  labelListInput.value = "";
  recipeNameInput.value = ""
  labelsContainer.innerHTML = ""
  labelsArray = []
  URLorBookInput.value = ""
  document.getElementById("recipeImageDiv").innerHTML = "";
  noteTextarea = ""
  otherTextarea = ""

  document.getElementById('otherInputs').classList.add('d-none');
  document.getElementById('urlandnoteInputs').classList.remove('d-none');

  document.getElementById('websiteBtn').checked = true

}
let addRecipeBtnIndicator = 0
containerRecipesDeleteError

addRecipeBtn.addEventListener("click", showAddRecipeSection);
  function showAddRecipeSection() {

    thisweekbtnclicked = false
    containerAddRecipeDetails.classList.toggle("d-none");
    containerSearch.classList.add("d-none");
    recipeCardsContainer.innerHTML = "";
    containerRecipesCards.classList.add("d-none")
    containerRecipesCardsError.innerHTML = "";
    recipeNameInput.value = ""
    labelListInput.value = ""
    URLorBookInput.value = ""
    labelsArray = []
    document.getElementById("labelsContainer").innerHTML = ""
    document.getElementById("recipeImageDiv").innerHTML = "";
    addRecipeBtnIndicator = 1 
    containerRecipesCardsDelete.classList.add("hidden");
    containerRecipesCardsDelete.classList.remove("border","border-dark"); // Add the border border-dark
    containerRecipesDeleteError.classList.add("hidden");
    recipeNameInput.focus();
    paginationContainer.classList.add("d-none");
    containerRecipesCardsDelete.classList.add("d-none");
    containerRecipesCardsError.classList.add("d-none");
    
  }

  
// Get a reference to the radio buttons
const PairOPTRadioButtons = document.querySelectorAll('input[name="PairOTPCheck"]');
let PairOPTRadioValue = "";

// Function to check the selected radio button and update the variable
function checkSelectedRadioPairOPT() {
  PairOPTRadioValue = "none"; // Initialize with "none"

  for (const radioButton of PairOPTRadioButtons) {
    if (radioButton.checked) {
      const label = document.querySelector(`label[for="${radioButton.id}"]`); 

      // Get the label's text content
      PairOPTRadioValue = label.textContent;  
      break; // Exit the loop once a checked button is found
    }
  }

}

checkSelectedRadioPairOPT();

PairOPTRadioButtons.forEach((radioButton) => {
  radioButton.addEventListener("change", checkSelectedRadioPairOPT);
});

addRecipeToDBBtn.addEventListener("click", addRecipeToDB);

function addRecipeToDB() {
    if (!errorMessageElement) {
        console.error("Error message element not found");
        return;
    }

    const recipeName = document.getElementById("recipeName").value.trim();
    const URLorBook = document.getElementById("URLorBook").value.trim();
    const otherBtn = document.getElementById("otherBtn");
    const noteTextarea = document.getElementById("noteTextarea").value.trim();
    const otherTextarea = document.getElementById("otherTextarea").value.trim();

    console.log({ recipeName, URLorBook, otherBtn, noteTextarea, otherTextarea });

    if (recipeName === "") {
        errorMessageElement.textContent = "Please enter a Recipe Name";
        errorMessageElement.style.display = "block";
        return;
    }

    if (labelsArray.length < 1) {
        errorMessageElement.textContent = "Please enter at least 1 label";
        errorMessageElement.style.display = "block";
        return;
    }

    if (!otherBtn.checked && URLorBook === "") {
        errorMessageElement.textContent = "Please enter a URL or Book";
        errorMessageElement.style.display = "block";
        return;
    }

    errorMessageElement.style.display = "none";

    let imgSrc;
    let imgElement = document.querySelector('#recipeImageDiv img');
    
    if (imgElement) {
        imgSrc = imgElement.src;
        console.log(imgSrc);
    } else {
        console.error("Image element not found");
    }

    if (addRecipeBtnIndicator === 1) {
        const requestData = {
            recipeName: recipeName,
            labelsArray: labelsArray,
            recipeImage: recipeImageURL,
            recipeLocation: PairOPTRadioValue,
            URLorBook: URLorBook,
            noteTextarea: noteTextarea,
            otherTextarea: otherTextarea
        };

        fetch("/api/sendRecipeToDBAPI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            clearInputs();
        })
        .catch((error) => {
            console.error("Error:", error);
        });

    } else if (addRecipeBtnIndicator === 2) {
        const requestData = {
            recipeNumber: recipeNumberID,
            recipeName: recipeName,
            labelsArray: labelsArray,
            recipeImage: imgSrc,
            recipeLocation: PairOPTRadioValue,
            URLorBook: URLorBook,
            noteTextarea: noteTextarea,
            otherTextarea: otherTextarea
        };
        console.log({noteTextarea});

        fetch("/api/ReplaceRecipeToDBAPI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        })
        .then((response) => response.json())
        .then((data) => {
            clearInputs();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }

    document.getElementById("showRecipeBtn").click();
}



const recipeSearch = document.getElementById("recipeSearch");
let recipevaluesToSearchFor = "";

showRecipeBtn.addEventListener("click", () => {

    countRecipes()
    countMadeRecipes()

    thisweekbtnclicked = false

    paginationContainer.classList.remove("d-none");
    containerRecipesCards.classList.remove("d-none")
    containerSearch.classList.remove("d-none");
    containerAddRecipeDetails.classList.add("d-none");
    recipeCardsContainer.innerHTML = "";
    containerRecipesCardsError.innerHTML = "";
    containerRecipesCards.classList.remove("border","border-dark"); // Add the border border-dark
    containerRecipesCardsDelete.classList.remove("border","border-dark"); // Add the border border-dark
    containerRecipesCardsDelete.classList.add("d-none");
    containerRecipesDeleteError.classList.add("hidden");
    recipeSearch.value = "";
    recipeSearch.focus();

    searchRecipes()

  })

  recipeSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchRecipes(); 
    }
  });

SearchBtn.addEventListener("click", searchRecipes);
function searchRecipes() {
  //containerRecipesCards.classList.add("border","border-dark"); // Add the border border-dark
  recipevaluesToSearchFor = recipeSearch.value;

  const requestBody = { labelsArray: recipevaluesToSearchFor };

  fetch("/api/POSTFindSearchItems", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      buildRecipeCards(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

}

let currentPage = 1;
const itemsPerPage = 24; // Number of recipes per page
let totalPages;

function buildRecipeCards(data) {
  // Calculate total pages
  totalPages = Math.ceil(data.length / itemsPerPage);

  // Calculate start and end indices for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Clear previous content

  //containerRecipesCards
  recipeCardsContainer.classList.remove("d-none");
  containerRecipesCardsDelete.classList.remove("border", "border-dark");
  recipeCardsContainer.innerHTML = "";
  containerRecipesCardsError.innerHTML = "";
  containerRecipesCardsDelete.innerHTML = "";
  containerRecipesCardsError.classList.add("d-none");

  if (data.length < 1) {
    //errorMessageHandling()
    recipeCardsContainer.classList.add("d-none");
    paginationContainer.classList.add("d-none");
    errorMessageHandling();
    console.log(453);
    err
    return;
  }

  // Build cards for the current page
  paginatedData.forEach((recipe) => {
    const productDiv = document.createElement("div");
    productDiv.style.border = "2px solid #00ACC1";
    productDiv.style.borderRadius = "10px";
    productDiv.style.padding = "10px";
    productDiv.style.margin = "0 10px 10px 0";
    productDiv.style.textAlign = "center";
    productDiv.style.width = "220px";
    productDiv.style.display = "flex";
    productDiv.style.flexDirection = "column";
    productDiv.style.minHeight = "300px";
    productDiv.classList.add("mt-4");

    if (recipe.recipeLocation === "Website" || recipe.recipeLocation === "Other") {
      productDiv.classList.add("hover");
    }

    const imageElement = document.createElement("img");
    imageElement.src = recipe.recipeImage;
    imageElement.style.borderRadius = "10px";
    imageElement.style.width = "150px";
    imageElement.style.height = "150px";
    imageElement.style.margin = "0 auto 10px auto"; // Center the image horizontally
    imageElement.classList.add("imghover");
    productDiv.appendChild(imageElement);

    const card = document.createElement("div");
    card.className = "card";
    card.style.textAlign = "center";
    card.style.backgroundColor = "#2C2C2C";
    card.style.border = "none";
    card.style.color = "white";
    card.innerHTML = `${recipe.recipeName}`;
    card.classList.add("imghover");
    productDiv.appendChild(card);

    if (recipe.recipeLocation === "Website") {
      imageElement.addEventListener('click', () => {
        window.open(recipe.URLorBook, '_blank');
      });
      card.addEventListener('click', () => {
        window.open(recipe.URLorBook, '_blank');
      });
    }

    const book = document.createElement("div");
    book.className = "card";
    book.style.backgroundColor = "#2C2C2C";
    book.style.border = "none";
    book.style.color = recipe.recipeLocation === "Website" ? "#2C2C2C" : "white";
    book.innerHTML = recipe.recipeLocation === "Website" ? "" : recipe.recipeLocation === "Other" ? "OTHER" : recipe.URLorBook;
    book.style.textAlign = "center";
    productDiv.appendChild(book);

    if (recipe.recipeLocation === "Other") {
      imageElement.addEventListener('click', () => {
        document.getElementById("displaynoteTextareaContainer").classList.remove("d-none");
        document.getElementById("displaynoteTextarea").value = recipe.otherTextarea;
      });
      card.addEventListener('click', () => {
        document.getElementById("displaynoteTextareaContainer").classList.remove("d-none");
        document.getElementById("displaynoteTextarea").value = recipe.otherTextarea;
      });
      book.addEventListener('click', () => {
        document.getElementById("displaynoteTextareaContainer").classList.remove("d-none");
        document.getElementById("displaynoteTextarea").value = recipe.otherTextarea;
      });
    }


    if (recipe.labelsArray.some(item => item.includes("made"))) {
      productDiv.style.border = "7px solid #00ACC1";
      card.style.backgroundColor = "#00ACC1";
      card.style.color = "#FFFFFF"; // White text
    }

    const btndiv = document.createElement("div");
    btndiv.style.marginTop = "auto"; // Pushes the button div to the bottom
    btndiv.style.padding = "5px"; // Ensure minimal space around the button
    btndiv.style.display = "flex"; // Flexbox to center the button
    btndiv.style.justifyContent = "space-evenly"; // Space between buttons

    const addButton = document.createElement("button");
    addButton.textContent = "Amend";
    //addButton.style.marginRight = "1px";
    addButton.classList.add("btn", "btn-success");

    const noteTextarea1 = recipe.noteTextarea || "";
    const otherTextarea1 = recipe.otherTextarea || "";
    addButton.onclick = () => {
      amendRecipe(
        recipe.recipeName,
        recipe.labelsArray,
        recipe.recipeImage,
        recipe.recipeLocation,
        recipe.URLorBook,
        recipe.recipeNumber,
        noteTextarea1,
        otherTextarea1
      );
    };

    const TWButton = document.createElement("button");
    TWButton.textContent = "TW";

    if (recipe.labelsArray.some(item => item.includes("This Week"))) {
      TWButton.classList.add("btn", "btn-warning");
    } else {
      TWButton.classList.add("btn", "btn-primary", "btn-custom");
    }

    
    TWButton.onclick = (event) => {
      TWUpdate(recipe.recipeNumber);
    };

    btndiv.appendChild(addButton);
    btndiv.appendChild(TWButton);
    productDiv.appendChild(btndiv);

    recipeCardsContainer.appendChild(productDiv);
  });

  renderPaginationControls(data); // Render pagination buttons
}

closeBtnNotesTextArea.addEventListener("click", () => {
  document.getElementById("displaynoteTextareaContainer").classList.add("d-none");
})

function renderPaginationControls(data) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = ""; // Clear previous pagination buttons

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("btn", "btn-primary", "btn-custom", "m-1");

    if (i === currentPage) {
      pageButton.classList.add("active"); // Highlight current page
    }

    pageButton.addEventListener("click", () => {
      currentPage = i;
      buildRecipeCards(data); // Rebuild cards for the selected page
    });

    paginationContainer.appendChild(pageButton);
  }
}



function amendRecipe(recipeName, labelsArray2, recipeImage, recipeLocation, URLorBook, recipeNumber, noteTextarea, otherTextarea) {

  //containerSearch.classList.toggle("hidden");
  //containerAddRecipeDetails.classList.toggle("hidden");
  containerAddRecipeDetails.classList.remove("d-none");
  document.getElementById("recipeName").value = recipeName
  document.getElementById("URLorBook").value = URLorBook
  document.getElementById("noteTextarea").value = noteTextarea
  document.getElementById("otherTextarea").value = otherTextarea
  addRecipeBtnIndicator = 2
  recipeNumberID = recipeNumber

  if (recipeLocation === "Website") {
    document.getElementById("websiteBtn").checked = true
    document.getElementById('otherInputs').classList.add('d-none');
    document.getElementById('urlandnoteInputs').classList.remove('d-none');
  } else if (recipeLocation === "Book") {
    document.getElementById("bookBtn").checked = true
    document.getElementById('otherInputs').classList.add('d-none');
    document.getElementById('urlandnoteInputs').classList.remove('d-none');
  } else if (recipeLocation === "Other") {
    document.getElementById("otherBtn").checked = true
    document.getElementById('otherInputs').classList.remove('d-none');
    document.getElementById('urlandnoteInputs').classList.add('d-none');
  }

  const ALL4imgExit = document.createElement("img");
  ALL4imgExit.src = recipeImage
  document.getElementById("recipeImageDiv").innerHTML = "";
  document.getElementById("recipeImageDiv").appendChild(ALL4imgExit);

  const labelsContainer = document.getElementById("labelsContainer")

  labelsContainer.innerHTML = "";
  labelsArray = labelsArray2
  labelsArray2.forEach((labelName) => {

  const mainDiv = document.createElement("div");
  mainDiv.classList.add("card", "borderdark","mb-2");
  mainDiv.style.border = "2px solid ";
  mainDiv.style.marginRight = "auto"; // Right-align the element


  const labelDiv = document.createElement("div");
  labelDiv.classList.add("card");
  labelDiv.style.display = "flex";
  //labelDiv.style.justifyContent = "center";
  labelDiv.style.marginLeft = "auto"; // Right-align the element
  labelDiv.textContent = labelName

  mainDiv.appendChild(labelDiv);

  const deleeteDiv = document.createElement("div");
  deleeteDiv.textContent = "X";
  deleeteDiv.classList.add("hover");
  deleeteDiv.style.color = "red";
  deleeteDiv.style.marginLeft = "auto"; // Right-align the element

  deleeteDiv.addEventListener("click", () => {
  const labelToRemove = deleeteDiv.parentElement
  const indexToRemove = labelsArray2.indexOf(labelName);
 
  if (indexToRemove > -1) {
  labelsArray2.splice(indexToRemove, 1); // Remove label from the array
  labelToRemove.remove(); // Remove the label from the DOM
  labelsArray = labelsArray2
    
  }
  });
    mainDiv.appendChild(deleeteDiv);
    labelsContainer.appendChild(mainDiv)
  })

  const recipeNameFocus = document.getElementById("recipeName");
  recipeNameFocus.focus();
  recipeNameFocus.scrollIntoView({ behavior: "smooth", block: "center" });
}


deleteRecipeBtn.addEventListener("click", showDeleteSection);

  function showDeleteSection() {

    thisweekbtnclicked = false
    containerRecipesCards.classList.remove("border","border-dark");
    recipeCardsContainer.innerHTML = "";
    containerSearch.classList.add("d-none");
    containerAddRecipeDetails.classList.add("d-none");
    containerRecipesCardsDelete.classList.add("border","border-dark"); 
    containerRecipesCardsDelete.classList.remove("d-none");
    containerRecipesCardsError.classList.add("d-none");
    

    fetch("/api/getRecipes")
    .then((response) => response.json())
    .then((data) => {
      buildDeleteTable(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function buildDeleteTable(data) {
  containerRecipesCardsDelete.innerHTML = "";
  containerRecipesCards.classList.add("d-none")
  data.forEach((recipe) => {
    const productDiv = document.createElement("div");
    productDiv.style.border = "2px solid #00ACC1";
    productDiv.style.borderRadius = "10px";
    productDiv.style.padding = "10px";
    productDiv.style.margin = "0 10px 10px 0";
    productDiv.style.textAlign = "center";
    productDiv.style.width = "220px";
    productDiv.style.display = "flex";
    productDiv.style.flexDirection = "column";
    productDiv.style.minHeight = "300px";
    productDiv.classList.add("mt-4");

    const imageElement = document.createElement("img");
    imageElement.src = recipe.recipeImage;
    imageElement.style.borderRadius = "10px";
    imageElement.style.width = "150px";
    imageElement.style.height = "150px";
    imageElement.style.margin = "0 auto 10px auto"; // Center the image horizontally
    imageElement.classList.add("imghover");
    productDiv.appendChild(imageElement);

    const card = document.createElement("div");
    card.className = "card";
    card.style.textAlign = "center";
    card.style.backgroundColor = "#2C2C2C";
    card.style.border = "none";
    card.style.color = "white";
    card.innerHTML = `${recipe.recipeName}`;
    card.classList.add("imghover");
    productDiv.appendChild(card);

    const book = document.createElement("div");
    book.className = "card";
    book.style.backgroundColor = "#2C2C2C";
    book.style.border = "none";
    book.style.color = recipe.recipeLocation === "Website" ? "#2C2C2C" : "white";
    book.innerHTML = recipe.recipeLocation === "Website" ? "test" : recipe.URLorBook;
    book.style.textAlign = "center";
    productDiv.appendChild(book);

    const btndiv = document.createElement("div");
    btndiv.style.marginTop = "auto"; // Pushes the button div to the bottom
    btndiv.style.padding = "5px"; // Ensure minimal space around the button
    btndiv.style.display = "flex"; // Flexbox to center the button
    btndiv.style.justifyContent = "center"; // Space between buttons

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Delete";
    button.classList.add("btn", "btn-danger", "mt-2"); // Note: Removed redundant "btn"

    btndiv.appendChild(button);
    productDiv.appendChild(btndiv);

    button.onclick = (event) => {
    deleteRecipe(recipe.recipeName);
  };
      containerRecipesCardsDelete.appendChild(productDiv);
  });
}


function deleteRecipe(recipeName) {

  fetch(`/api/deleteRecipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipeName })
  })
  .then(response => response.json())
  .then(data => {
    console.log('data', data);

    deleteRecipeErrormessage()

  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function deleteRecipeErrormessage() {



    containerRecipesDeleteError.classList.remove("d-none");
    containerRecipesDeleteError.innerHTML = "Recipe deleted";
    containerRecipesDeleteError.style.textAlign = "center";
    containerRecipesDeleteError.style.color = "red";
    containerRecipesDeleteError.style.fontWeight = "bold";
    showDeleteSection()
  
}

function countRecipes() {
  fetch("/api/countRecipes", {
    method: "GET", // Assuming a GET request, change to POST if needed
    headers: {
      "Content-Type": "application/json",
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const recipeCount = data.count;
      console.log("Number of recipes:", recipeCount);
      
      // You can now use the recipeCount value as needed
      // For example, displaying it in the DOM
      document.getElementById('recipeCountDisplay').innerText = `Total Recipes: ${recipeCount}`;
    })
    .catch((error) => {
      console.error("Error counting recipes:", error);
    });
}

// Event listener to run countRecipes when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", countRecipes);

function countMadeRecipes() {
  fetch("/api/countMadeRecipes", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const madeCount = data.count;
      console.log("Number of recipes with 'made':", madeCount);

      document.getElementById('madeRecipeCountDisplay').innerText = `Recipes "To be made": ${madeCount}`;
    })
    .catch((error) => {
      console.error("Error counting recipes with 'made':", error);
    });
}

// Event listener to run countMadeRecipes when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", countMadeRecipes);

function TWUpdate(recipeNumber) {

  fetch("/api/TWUpdate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipeNumber }),
  })
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    if (thisweekbtnclicked == true) {
      thisWeekRecipes() 
    } else {
       searchRecipes()
    }
   
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

thisWeekBtn.addEventListener("click", thisWeekRecipes);
function thisWeekRecipes() {

  thisweekbtnclicked = true

  
  recipevaluesToSearchFor = "This Week"
  containerAddRecipeDetails.classList.add("d-none");

  const requestBody = { labelsArray: recipevaluesToSearchFor };

  fetch("/api/POSTFindSearchItemsThisWeek", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.length>0) {
        containerRecipesCards.classList.remove("d-none")
        containerSearch.classList.remove("d-none");
        paginationContainer.classList.remove("d-none");
        buildRecipeCards(data);
      } else{
        containerRecipesCards.classList.add("d-none")
        containerSearch.classList.add("d-none");
        paginationContainer.classList.add("d-none");
        errorMessageHandling()
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

}

function errorMessageHandling(){
  containerRecipesCardsError.classList.remove("d-none");
  containerRecipesCardsError.innerHTML = "No recipes found for that search";
  containerRecipesCardsError.style.textAlign = "center";
  containerRecipesCardsError.style.color = "red";
  containerRecipesCardsError.style.fontWeight = "bold";
}

document.getElementById('madeRecipeCountDisplay').onclick = showToBeMadeRecipes

function showToBeMadeRecipes() {

  const listItems = [
    "containerRecipesCards",
    "containerSearch",
    "paginationContainer",
]

listItems.forEach( (item) => {
  document.getElementById(item).classList.remove("d-none");

  })
 

  // containerRecipesCards.classList.remove("d-none")
  // containerSearch.classList.remove("d-none");
  // paginationContainer.classList.remove("d-none");
  containerAddRecipeDetails.classList.add("d-none");
  
  recipevaluesToSearchFor = "to be made"

  const requestBody = { labelsArray: recipevaluesToSearchFor };

  fetch("/api/POSTFindSearchItemsToBeMade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    
  })
    .then((response) => response.json())
    .then((data) => {
      buildRecipeCards(data);
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

}



