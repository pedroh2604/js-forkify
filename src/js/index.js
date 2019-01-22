// API Key b161f959243bab4ef19b87cd423164d0
// API Key 3f8e1211f3a411363be4682485b7af3c
// API Key 03300cccb1f742f4ae8bc950cbc0956f
// API Key 1832868ceece623bb0171eed304968bc
// https://www.food2fork.com/api/search
// https://www.food2fork.com/api/get 

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';
/**
* - Search object
* - Current Recipe object
* - Shopping list object
* - Liked recipes
*/
const state = {};

console.log(1 === true);

/**
* SEARCH CONTROLLER
*/
const controlSearch = async () => {
	// 1. Get query from view
	const query = searchView.getInput(); 
	//console.log(query);

	if(query) {
		// 2. New search object and add to state
		state.search = new Search(query);
		// console.log(query);

		// 3. Prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			// 4. Search for recipes
			await state.search.getResults();

			// 5. Render results on UI
			// console.log(state.search.result);
			clearLoader();
			searchView.renderResults(state.search.result);
		} catch (err) {
			alert('Something wrong with the search...');
			clearLoader();
		}
	}
}

// search form
elements.searchForm.addEventListener('submit', e => {
	// prevents the page from reloading
	e.preventDefault();
	controlSearch();
});

// pagination, button click
elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	// console.log(btn);
	// 10 means that the number is decimal, 2 would stand for binary, and so on
	const goToPage = parseInt(btn.dataset.goto, 10);
	// this way the buttons will not be repeated
	searchView.clearResults();
	// displays the buttons
	searchView.renderResults(state.search.result, goToPage);
	// console.log(goToPage);
});


/**
* RECIPE CONTROLLER
*/

const controlRecipe = async () => {
	// finds the id and replace the hash '#' with nothing, we're just interested in the number
	const id = window.location.hash.replace('#', '');
	// console.log(id);

	if (id) {
		// Prepares the UI for changes
		recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightedSelected(id);

		// Creates new recipe object
		state.recipe = new Recipe(id);

		try {
			// Gets recipe data and parse ingredients
			await state.recipe.getRecipe();
            state.recipe.parseIngredients();

			// Calculates servings and time
			state.recipe.calcTime();
            state.recipe.calcServings();

			// Renders recipe
			//console.log(state.recipe);
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
			);
		} catch(err) {
			alert('Error processing recipe!');
		}
	}
};

//window.addEventListener('hashchange', controlRecipe);

// used when the user reloads the page, this way he can bookmark and id, for example
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
* LIST CONTROLLER
*/

const controlList = () => {
	// Create a new list IF there is none yet
	if(!state.list) state.list = new List();

	// Add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// Handle the delete button
	if (e.target.matches('.shopping__delete, .shopping__delete *')) {
		// Delete from state
		state.list.deleteItem(id);

		// Delete from UI
		listView.deleteItem(id);

		// Handles the count update
	} else if (e.target.matches('.shopping__count-value')) {
		// reads the data from the interface, then updates it
		const val = parseFloat(e.target.value, 10);
		state.list.updateCount(id, val);
	}
});

/**
* LIKE CONTROLLER
*/

const controlLike = () => {
	if (!state.likes) state.likes = new Likes();

	const currentID = state.recipe.id;

	// User has NOT yet liked current recipe
	if (!state.likes.isLiked(currentID)) {
		// Add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);

		// Toggle the like button
		likesView.toggleLikeBtn(true);

		// Add like to the UI list
		likesView.renderLike(newLike);
		// console.log(state.likes);
	// User HAS liked current recipe	
	} else {
		// Remove like from the state
		state.likes.deleteLike(currentID);

		// Toggle the like button
		likesView.toggleLikeBtn(false);

		// Remove like from the UI list
		//console.log(state.likes);
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
	state.likes = new Likes();

	// Restores likes
	state.likes.readStorage();

	// Toggles like menu button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Renders the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks 
elements.recipe.addEventListener('click', e => {
	// * means that applies to the child elements as well
	if (e.target.matches('.btn-decrease, .btn-decrease *')) {
		// decrease button is clicked
		if(state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
		// increase button is 
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	} else if (e.target.matches('.recipe__btn--add, recipe__btn--add *')) {
		// Adds ingredients to shopping list
		controlList();
	} else if (e.target.matches('.recipe__love, .recipe__love *')) {
		// Like controller
		controlLike();
	}
	console.log(state.recipe);
});
