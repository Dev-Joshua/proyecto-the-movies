const api = axios.create({
  baseURL: "https://api.themoviedb.org/3/",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
  params: {
    api_key: API_KEY,
  },
});

/* Utils */
function createMovies(movies, container) {
  container.innerHTML = "";

  /* agrego contenido dinamicamente manipulando el DOM en cada elemento iterado*/
  movies.forEach((movie) => {
    const movieContainer = document.createElement("div");
    movieContainer.classList.add("movie-container");

    const movieImg = document.createElement("img");
    movieImg.classList.add("movie-img");
    movieImg.setAttribute("alt", movie.title);
    movieImg.setAttribute(
      "src",
      "https://image.tmdb.org/t/p/w300/" + movie.poster_path
    );

    movieContainer.appendChild(movieImg);
    container.appendChild(movieContainer);
  });
}

/* Solicitudes a la API para insertar data en cada page.*/

/* Home */
async function getTrendingMoviesPreview() {
  const { data } = await api("trending/movie/day");
  const movies = data.results;
  // console.log({ data, movies });

  createMovies(movies, trendingMoviesPreviewList);
}

async function getCategoriesPreview() {
  const { data, status } = await api("genre/movie/list");
  const categories = data.genres;

  /* Limpio la section x si tiene alguna info */
  categoriesPreviewList.innerHTML = "";

  categories.forEach((category) => {
    const categoryContainer = document.createElement("div");
    categoryContainer.classList.add("category-container");

    const categoryTitle = document.createElement("h3");
    categoryTitle.classList.add("category-title");
    categoryTitle.setAttribute("id", "id" + category.id);
    categoryTitle.addEventListener("click", () => {
      location.hash = `#category=${category.id}-${category.name}`;
    });
    const categoryTitleText = document.createTextNode(category.name);

    categoryTitle.appendChild(categoryTitleText);
    categoryContainer.appendChild(categoryTitle);
    categoriesPreviewList.appendChild(categoryContainer);
  });
  console.log(`Estatus de la solicitud: ${status}`);
}

/* Section genericList #category= */
async function getMoviesByCategory(id) {
  const { data } = await api("discover/movie", {
    params: {
      with_genres: id,
    },
  });
  const movies = data.results;

  createMovies(movies, genericSection);
}

/* Section searchPage #search= */
async function getMoviesBySearch(query) {
  const { data } = await api("search/movie", {
    params: {
      query,
    },
  });
  const movies = data.results;

  createMovies(movies, genericSection);
}
