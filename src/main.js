const api = axios.create({
  baseURL: "https://api.themoviedb.org/3/",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
  params: {
    api_key: API_KEY,
    language: navigator.language || "es-CO",
  },
});

/* Utils */

const lazyLoader = new IntersectionObserver((entries) => {
  // recibo c/u de los elementos que estemos observando
  entries.forEach((entryMovie) => {
    if (entryMovie.isIntersecting) {
      const url = entryMovie.target.getAttribute("data-img");
      entryMovie.target.setAttribute("src", url);
    }
  });
});

function createMovies(
  movies,
  container,
  { lazyLoad = false, clean = true } = {}
) {
  // clean es true? = limpiar contenedor
  if (clean) {
    container.innerHTML = "";
  }

  /* agrego contenido dinamicamente manipulando el DOM en cada elemento iterado*/
  movies.forEach((movie) => {
    const movieContainer = document.createElement("div");
    movieContainer.classList.add("movie-container");
    movieContainer.addEventListener("click", () => {
      location.hash = "#movie=" + movie.id;
    });

    const movieImg = document.createElement("img");
    movieImg.classList.add("movie-img");
    movieImg.setAttribute("alt", movie.title);
    movieImg.setAttribute(
      lazyLoad ? "data-img" : "src",
      "https://image.tmdb.org/t/p/w300/" + movie.poster_path
    );
    movieImg.addEventListener("error", () => {
      movieImg.setAttribute(
        "src",
        "https://img.freepik.com/vector-gratis/pagina-error-404-distorsion_23-2148105404.jpg"
      );
    });

    if (lazyLoad) {
      lazyLoader.observe(movieImg);
    }

    movieContainer.appendChild(movieImg);
    container.appendChild(movieContainer);
  });
}

function createCategories(categories, container) {
  /* Limpio la section x si tiene alguna info */
  container.innerHTML = "";

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
    container.appendChild(categoryContainer);
  });
}

/* Solicitudes a la API para insertar data en cada page.*/

/* Home */
async function getTrendingMoviesPreview() {
  const { data } = await api("trending/movie/day");
  const movies = data.results;
  // console.log({ data, movies });

  createMovies(movies, trendingMoviesPreviewList, { lazyLoad: true });
}

async function getCategoriesPreview() {
  const { data, status } = await api("genre/movie/list");
  const categories = data.genres;

  createCategories(categories, categoriesPreviewList);
  // console.log(`Estatus de la solicitud: ${status}`);
}

/* Section genericList #category= */
async function getMoviesByCategory(id) {
  const { data } = await api("discover/movie", {
    params: {
      with_genres: id,
    },
  });
  const movies = data.results;
  //maxPage se debe agregar en cada ruta que se haga infiniteScroll
  maxPage = data.total_pages;
  createMovies(movies, genericSection, { lazyLoad: true });
}

/* Clousure de navegacion */
function getPaginatedMoviesByCategory(id) {
  return async function () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
    const pageIsNoMax = page < maxPage;

    if (scrollIsBottom && pageIsNoMax) {
      page++;
      const { data } = await api("discover/movie", {
        params: {
          with_genres: id,
          page,
        },
      });
      const movies = data.results;

      createMovies(movies, genericSection, { lazyLoad: true, clean: false });
    }
  };
}

/* Section searchPage #search= */
async function getMoviesBySearch(query) {
  const { data } = await api("search/movie", {
    params: {
      query,
    },
  });
  const movies = data.results;
  maxPage = data.total_pages;
  console.log(maxPage);

  createMovies(movies, genericSection, { lazyLoad: true });
}

/* Clousure de navegacion */
function getPaginatedMoviesBySearch(query) {
  return async function () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
    const pageIsNoMax = page < maxPage;

    if (scrollIsBottom && pageIsNoMax) {
      page++;
      const { data } = await api("search/movie", {
        params: {
          query,
          page,
        },
      });
      const movies = data.results;

      createMovies(movies, genericSection, { lazyLoad: true, clean: false });
    }
  };
}

/* Section trending page*/
async function getTrendingMovies() {
  const { data } = await api("trending/movie/day");
  const movies = data.results;
  maxPage = data.total_pages;
  // console.log({ data, movies });
  // console.log(data.total_pages);

  createMovies(movies, genericSection, { lazyLoad: true, clean: true });
}

async function getPaginatedTrendingMovies() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  // si el scroll llego al final(bttom) de la aplicacion entonces llamamos la nueva api en la pagina correspondiente
  const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
  const pageIsNoMax = page < maxPage;

  /*si el scroll esta al final y la pagina no es la ultima pagina entonces:*/
  if (scrollIsBottom && pageIsNoMax) {
    page++;
    const { data } = await api("trending/movie/day", {
      params: {
        page,
      },
    });
    const movies = data.results;
    // console.log(data);

    createMovies(movies, genericSection, { lazyLoad: true, clean: false });
  }
}

/* Section movieDetail page */
async function getMovieById(id) {
  //renombro a mi objeto data a movie => este contiene la informacion de la pelicula
  const { data: movie } = await api("movie/" + id);

  const movieImgUrl = "https://image.tmdb.org/t/p/w500" + movie.poster_path;
  headerSection.style.background = `
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.35) 19.27%,
      rgba(0, 0, 0, 0) 29.17%
    ), 
    url(${movieImgUrl})
  `;

  movieDetailTitle.textContent = movie.title;
  movieDetailDescription.textContent = movie.overview;
  movieDetailScore.textContent = movie.vote_average.toFixed(1);

  createCategories(movie.genres, movieDetailCategoriesList);

  getRelatedMoviesId(id);
}

async function getRelatedMoviesId(id) {
  const { data } = await api(`movie/${id}/similar`);
  const similarMovies = data.results;

  console.log(similarMovies);
  createMovies(similarMovies, relatedMoviesContainer);
}
