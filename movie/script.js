document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.movie-search');
    const suggestions = document.querySelector('.suggestions');
    const movieGrid = document.querySelector('.movie-grid');
    const movieModal = document.getElementById('movieModal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.querySelector('.modal-title');
    const modalImg = document.querySelector('.modal-img');
    const modalSynopsis = document.querySelector('.modal-synopsis');
    const modalRating = document.querySelector('.modal-rating');
    const modalRuntime = document.querySelector('.modal-runtime');
    const modalCast = document.querySelector('.modal-cast');
    const addToWatchlistBtn = document.querySelector('.add-to-watchlist');
    const watchlistContainer = document.querySelector('.watchlist-movies');
    const sortOptions = document.getElementById('sortOptions'); // Added sorting options element
    const removeFromWatchlistBtn = document.querySelector('.remove-from-watchlist');

    const API_KEY = '065b74422c8f4fb917baac81d7e981d2'; // Replace with your API key
    const WATCHLIST_KEY = 'watchlistMovies';

    let movies = []; // Array to store movies

    let watchlistMovies = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];

    // Display movies in "Watchlist"
    function displayWatchlist() {
        watchlistContainer.innerHTML = ''; // Clear the container
        if (watchlistMovies.length === 0) {
            watchlistContainer.innerHTML = '<p>Your watchlist is empty.</p>';
        } else {
            watchlistMovies.forEach(movie => {
                const movieCard = createMovieCard(movie);
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Remove';
                deleteBtn.classList.add('delete-btn');
                deleteBtn.addEventListener('click', () => removeFromWatchlist(movie.id));

                // Add delete button to movie card
                const cardContainer = document.createElement('div');
                cardContainer.classList.add('movie-card-container');
                cardContainer.appendChild(movieCard);
                cardContainer.appendChild(deleteBtn);
                watchlistContainer.appendChild(cardContainer);
            });
        }
    }

    function removeFromWatchlist(movieId) {
        // Remove movie by ID
        watchlistMovies = watchlistMovies.filter(movie => movie.id !== movieId);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlistMovies));
        displayWatchlist(); // Update "Watchlist" display
        alert('Movie removed from the watchlist');
    }

    // Create movie card
    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p>${movie.release_date}</p>
        `;
        card.addEventListener('click', () => showMovieDetails(movie));
        return card;
    }

    // Show movie details in modal window
    async function showMovieDetails(movie) {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`);
        const details = await response.json();

        modalTitle.textContent = details.title;
        modalImg.src = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        modalSynopsis.textContent = details.overview;
        modalRating.textContent = `Rating: ${details.vote_average}`;
        modalRuntime.textContent = `Runtime: ${details.runtime} min`;
        modalCast.innerHTML = details.cast ? details.cast.map(cast => `<li>${cast.name} as ${cast.character}</li>`).join('') : 'No cast data available';

        // If movie is already in the watchlist, show the "Remove from Watchlist" button
        if (watchlistMovies.some(watchlistMovie => watchlistMovie.id === movie.id)) {
            removeFromWatchlistBtn.style.display = 'inline-block'; // Show the remove button
            removeFromWatchlistBtn.onclick = () => {
                removeFromWatchlist(movie.id); // Remove movie from watchlist
                closeModal(); // Close modal window
            };
        } else {
            removeFromWatchlistBtn.style.display = 'none'; // Hide the remove button if the movie is not in the watchlist
        }

        addToWatchlistBtn.onclick = () => {
            addToWatchlist(details);
        };

        movieModal.style.display = 'block'; // Show modal window
        modalOverlay.style.display = 'block'; // Show overlay
    }

    // Add movie to the "Watchlist"
   // Add movie to the "Watchlist"
function addToWatchlist(movie) {
    // Check if movie is already in the watchlist
    if (!watchlistMovies.some(watchlistMovie => watchlistMovie.id === movie.id)) {
        watchlistMovies.push(movie); // Add movie to watchlist array
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlistMovies)); // Save updated watchlist to localStorage
        displayWatchlist(); // Update "Watchlist" display
        alert('Movie added to Watchlist!');
    } else {
        alert('This movie is already in your Watchlist!');
    }

    // Close modal after adding to watchlist
    closeModal();
}


    // Close modal window
    modalClose.addEventListener('click', () => {
        movieModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });

    // Close modal window if clicking outside of the window
    window.addEventListener('click', event => {
        if (event.target === movieModal) {
            movieModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        }
    });

    // Search for movies
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query.length > 2) {  // Start search after typing 3 characters
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`);
            const data = await response.json();
            showSuggestions(data.results);
        } else {
            suggestions.innerHTML = ''; // Hide suggestions if search input is empty
        }
    });

    // Show search suggestions
    function showSuggestions(results) {
        if (results.length > 0) {
            suggestions.innerHTML = results.map(result => 
                `<div class="suggestion-item" data-id="${result.id}">
                    <img src="https://image.tmdb.org/t/p/w500${result.poster_path}" alt="${result.title}">
                    <p>${result.title}</p>
                </div>` 
            ).join('');
            suggestions.style.display = 'block';
            suggestions.addEventListener('click', selectMovie);
        } else {
            suggestions.innerHTML = '<p>No movies found</p>';
            suggestions.style.display = 'block';
        }
    }

    // Select movie from suggestions
    async function selectMovie(event) {
        const movieId = event.target.closest('.suggestion-item').dataset.id; // Get movie ID
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
        const movie = await response.json();
        showMovieDetails(movie);
        suggestions.innerHTML = ''; // Clear suggestions after selecting
        suggestions.style.display = 'none';
    }

    // Load popular movies when page loads
    async function loadMovies() {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
        const data = await response.json();
        movies = data.results; // Save movies in array
        displayMovies(movies); // Display movies
    }

    // Display movies
    function displayMovies(movies) {
        movieGrid.innerHTML = ''; // Clear the container
        movies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            movieGrid.appendChild(movieCard);
        });
    }

    // Sort movies
    function sortMovies(criteria) {
        let sortedMovies;
        if (criteria === 'popularity') {
            sortedMovies = [...movies].sort((a, b) => b.popularity - a.popularity); // Sort by popularity
        } else if (criteria === 'release_date') {
            sortedMovies = [...movies].sort((a, b) => new Date(b.release_date) - new Date(a.release_date)); // Sort by release date
        } else if (criteria === 'vote_average') {
            sortedMovies = [...movies].sort((a, b) => b.vote_average - a.vote_average); // Sort by rating
        }
        displayMovies(sortedMovies); // Update movie display
    }

    // Sort option change handler
    sortOptions.addEventListener('change', () => {
        const selectedOption = sortOptions.value;
        sortMovies(selectedOption); // Sort movies
    });

    // Open modal window
    function openModal() {
        movieModal.style.display = 'block';
        modalOverlay.style.display = 'block';
    }

    // Close modal window
    function closeModal() {
        movieModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    // Close window when clicking on close button
    modalClose.addEventListener('click', closeModal);

    // Close window when clicking on the overlay
    modalOverlay.addEventListener('click', closeModal);

    // Display "Watchlist" on page load
    displayWatchlist();
    loadMovies();
});
