// Wait for the full DOM to load before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to page elements
    const searchInput = document.querySelector('.recipe');
    const suggestions = document.querySelector('.suggestions');
    const favoritesContainer = document.querySelector('.favorite-recipes');
    const recipeModal = document.getElementById('recipeModal');
    const modalClose = document.querySelector('.modal-close');
    const favoriteButton = document.querySelector('.favorite-button');

    // Key for storing favorite recipes in localStorage
    const FAVORITES_KEY = 'favoriteRecipes';
    // Load favorite recipes from localStorage (or an empty array if none are found)
    let favoriteRecipes = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

    // Function to display the list of favorite recipes
    function displayFavorites() {
        // Clear the suggestions container when updating favorite recipes
        suggestions.innerHTML = '';

        // Clear the favorite recipes container before updating
        favoritesContainer.innerHTML = ''; 
        if (favoriteRecipes.length === 0) {
            // Message if no favorite recipes are added
            favoritesContainer.innerHTML = '<p>No favorite recipes added yet!</p>';
        } else {
            favoritesContainer.classList.add('grid-layout');
            favoriteRecipes.forEach(recipe => {
                // Create a recipe card and append it to the container
                const recipeCard = createRecipeCard(recipe);
                recipeCard.addEventListener('click', () => displayRecipe(recipe));
                favoritesContainer.appendChild(recipeCard);
            });
        }
    }

    // Function to save favorite recipes in localStorage
    function saveFavorites() {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteRecipes));
    }

    // Function to add or remove a recipe from favorites
    function toggleFavorite(recipe) {
        // Check if the recipe is already in favorites
        const index = favoriteRecipes.findIndex(fav => fav.id === recipe.id);
        if (index >= 0) {
            // If the recipe is already in favorites, remove it
            favoriteRecipes.splice(index, 1);  
        } else {
            // If not, add it to favorites
            favoriteRecipes.push(recipe); 
        }
        // Save the updated list and update the display
        saveFavorites();  
        displayFavorites();
    
        // Check if the modal is open and update the button text
        const isFavorite = favoriteRecipes.some(fav => fav.id === recipe.id);
        favoriteButton.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }

    // Function to create a recipe card
    function createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.classList.add('food-recipe');
        // HTML for the recipe card
        card.innerHTML = `
            <div class="food-img"><img src="${recipe.image}" alt="${recipe.title}"></div>
            <div class="food-details">
                <h3>${recipe.title}</h3>
                <p>${recipe.instructions ? recipe.instructions.slice(0, 100) : "Instructions unavailable"}...</p>
                <p>Ready in ${recipe.readyInMinutes} minutes</p>
                <button class="favorite-icon">&#9733;</button>
            </div>
        `;
        // Add event listener to the favorite icon
        card.querySelector('.favorite-icon').addEventListener('click', (e) => {
            e.stopPropagation(); // Stop the event from propagating to prevent opening the modal
            toggleFavorite(recipe); // Add or remove the recipe from favorites
        });
        return card;
    }

    // Event handler for text input to search recipes
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value;
        // Check if the query is longer than 2 characters
        if (query.length > 2) {
            // Check if searching by ingredients (comma-separated)
            const searchByIngredients = query.includes(',');
            const apiURL = searchByIngredients
                ? `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=5&apiKey=01e420aa9d684924bc389aa14cd08968`
                : `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=5&apiKey=01e420aa9d684924bc389aa14cd08968`;

            const response = await fetch(apiURL);
            const data = await response.json();
            const results = searchByIngredients ? data : data.results;
            showSuggestions(results); // Display the suggestions
        } else {
            suggestions.innerHTML = ''; // Clear suggestions for short queries
        }
    });

    // Function to display the list of recipe suggestions
    function showSuggestions(results) {
        suggestions.innerHTML = results.map(result => `<div data-id="${result.id}">${result.title}</div>`).join('');
        suggestions.addEventListener('click', selectRecipe);
    }

    // Function to get information about the selected recipe
    async function selectRecipe(event) {
        const recipeId = event.target.dataset.id;
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=01e420aa9d684924bc389aa14cd08968`);
        const recipe = await response.json();
        displayRecipe(recipe); // Display the recipe in the modal
    }

    // Function to display the recipe in a modal window
    async function displayRecipe(recipe) {
        document.querySelector('.modal-title').textContent = recipe.title;
        document.querySelector('.modal-img').src = recipe.image;
        document.querySelector('.modal-description').textContent = recipe.instructions || "Instructions unavailable";
        
        // Display the ingredients
        document.querySelector('.modal-ingredients').innerHTML = recipe.extendedIngredients.map(ingredient => 
            `<li>${ingredient.amount} ${ingredient.unit} ${ingredient.name}</li>`
        ).join('');

        // Display the step-by-step instructions
        const steps = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps : [];
        document.querySelector('.modal-description').innerHTML += `<h3>Instructions:</h3><ol>${steps.map(step => `<li>${step.step}</li>`).join('')}</ol>`;

        // Display nutrition information
        const nutrition = recipe.nutrition || {};
        document.querySelector('.nutrition-info').innerHTML = `
            <p>Calories: ${nutrition.calories || 'N/A'} kcal</p>
            <p>Protein: ${nutrition.protein || 'N/A'} g</p>
            <p>Fat: ${nutrition.fat || 'N/A'} g</p>
            <p>Carbs: ${nutrition.carbs || 'N/A'} g</p>
        `;

        // Set the favorite button text based on the recipe's status
        const isFavorite = favoriteRecipes.some(fav => fav.id === recipe.id);
        favoriteButton.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
        favoriteButton.onclick = () => {
            toggleFavorite(recipe); // Add or remove recipe from favorites
        };

        recipeModal.style.display = 'block'; // Show the modal
    }

    // Close the modal when clicking on the close button (X)
    modalClose.addEventListener('click', () => {
        recipeModal.style.display = 'none';
    });

    // Close the modal when clicking outside of the modal
    window.addEventListener('click', event => {
        if (event.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });

    // Display favorite recipes when the page loads
    displayFavorites();
});
