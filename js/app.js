function iniciarApp(){

    const selectCategorias = document.querySelector('#categorias')
    const containerRecetas = document.querySelector('#resultado')
    const loader = document.querySelector('#loader')
    const formSelect = document.querySelector('#form-select-rect');
    const rowUp = document.querySelector('#row-up')

    if(selectCategorias){
        selectCategorias.addEventListener('change', selectCategoria)
        obtenerCategorias()
    }

    const favoritosDiv = document.querySelector('.favoritos')
    if(favoritosDiv){
        obtenerFavoritos()
    }

    if(formSelect){
        
        function isInViewport(formSelect) {
            const rect = formSelect.getBoundingClientRect();
            return (
                rect.top >=  0 &&
                rect.left >=  0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    
        function handleVisibilityChange() {
            if (isInViewport(formSelect)) {
                // console.log('Element is visible in viewport');
                rowUp.classList.add('row-up-off')
            } else {
                // console.log('Element is not visible in viewport');
                rowUp.classList.remove('row-up-off')
            }
        }
        
        window.addEventListener('scroll', handleVisibilityChange);
        window.addEventListener('resize', handleVisibilityChange);

        rowUp.addEventListener('click', () => {
            window.scrollTo({
                top:  0,
                behavior: 'smooth'
            });
        })
        
    }


    const modal = new bootstrap.Modal('#modal', {}) //Se instancia el modal que pertenece a Bootstrap

    function obtenerCategorias(){
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarCategorias(resultado.categories))
    }

    function mostrarCategorias(categorias = []){
        // console.log(categorias);
        categorias.forEach(categoria => {
            const option = document.createElement('option')
            option.value = categoria.strCategory
            option.textContent = categoria.strCategory
            option.setAttribute('id', categoria.idCategory)
            selectCategorias.appendChild(option)
        })
        
    }

    function selectCategoria(e){
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => {
                showLoader()
                setTimeout(() => {
                    mostrarRecetas(resultado.meals)
                },1000)
            })
    }

    function mostrarRecetas(recetas = []){
        
        cleanHTML('#resultado')
        
        const headingResults = document.createElement('h2')
        headingResults.classList.add('text-center', 'text-black', 'my-5')
        headingResults.textContent = `${recetas.length} ${recetas.length == 0 ? 'Result' : 'Results'}`
        resultado.appendChild(headingResults)

        recetas.forEach(receta => {

            const { idMeal, strMeal, strMealThumb } = receta;

            const recetaContenedor = document.createElement('div')
            recetaContenedor.classList.add('col-md-4')

            const recetaCard = document.createElement('div')
            recetaCard.classList.add('card', 'mb-4')
            
            const recetaImagen = document.createElement('img')
            recetaImagen.classList.add('card-img-top', 'object-fit-contain')
            recetaImagen.src =  strMealThumb ?? receta.img
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.title}`

            const recetaCardBody = document.createElement('div')
            recetaCardBody.classList.add('card-body')

            const recetaHeading = document.createElement('h3')
            recetaHeading.classList.add('card-title', 'mb-3')
            recetaHeading.textContent = strMeal

            const recetaButton = document.createElement('button')
            recetaButton.classList.add('btn', 'btn-danger', 'w-100')
            recetaButton.textContent = 'Ver Receta'
            //Se le agregan algunos parametros de Bootstrap
            // recetaButton.dataset.bsTarget = "#modal"
            // recetaButton.dataset.bsToggle = "modal"

            //Se le agrega un onclick porque no existe en el HTML por ende addEventListener no funcionara
            recetaButton.onclick = function(){
                seleccionarReceta(idMeal ?? receta.id)
            }

            //Inyectarlo al HTML
            recetaCardBody.appendChild(recetaHeading)
            recetaCardBody.appendChild(recetaButton)

            recetaCard.appendChild(recetaImagen)
            recetaCard.appendChild(recetaCardBody)

            recetaContenedor.appendChild(recetaCard)

            containerRecetas.appendChild(recetaContenedor)
        })
    }

    function seleccionarReceta(id){
        // console.log(id);
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal(resultado.meals[0]))
    }

    function mostrarRecetaModal(receta){

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

        const modalTitle = document.querySelector('.modal .modal-title')
        const modalBody = document.querySelector('.modal .modal-body')

        modalTitle.textContent = strMeal
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Receta ${strMeal}">
            <h3 class"my-3">Instructions</h3>
            <p>${strInstructions}</p>
            <h3 class"my-3">Ingredients and Quantities<h3>
        `;

        // console.log(receta.strIngredient1);

        const listGroup = document.createElement('ul')
        listGroup.classList.add('list-group')

        // Mostrar cantidades e ingredientes
        for(let i = 1; i <= 20; i++){
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`]
                const cantidad = receta[`strMeasure${i}`]

                // console.log(`${ingrediente} - ${cantidad}`);

                const ingredienteLi = document.createElement('li')
                ingredienteLi.classList.add('list-group-item')
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`
                listGroup.appendChild(ingredienteLi)
            }
        }
        modalBody.appendChild(listGroup)

        
        //Botones de Cerrar y Favoritos
        const modalFooter =  document.querySelector('.modal-footer')
        cleanHTML('.modal-footer')

        const btnFavorito = document.createElement('button')
        btnFavorito.classList.add('btn', 'btn-danger', 'col')
        btnFavorito.textContent = existStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito'

        //LocalStorage
        btnFavorito.onclick = function() {

            if(existStorage(idMeal)){
                eliminarFavorito(idMeal)
                btnFavorito.textContent = 'Guardar Favorito'
                mostrarToast('Eliminado Correctamente')
                return
            }
            agregarFavorito({ 
                id: idMeal, 
                title: strMeal, 
                img: strMealThumb
            })
            mostrarToast('Guardado Correctamente')
            btnFavorito.textContent = 'Eliminar Favorito'
        }

        const btnCerrarModal = document.createElement('button')
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col')
        btnCerrarModal.textContent = 'Cerrar'
        btnCerrarModal.onclick = () => modal.hide()

        modalFooter.appendChild(btnFavorito)
        modalFooter.appendChild(btnCerrarModal)

        modal.show()
    }

    function eliminarFavorito(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id) //Traer los diferentes al id que le pasemos
        // console.log(nuevosFavoritos);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos))
    }

    function agregarFavorito(objReceta){
        // console.log(objReceta);
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [] //Si no existe el elemento lo crea

        localStorage.setItem('favoritos', JSON.stringify([...favoritos, objReceta]))
    }

    function existStorage(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        return favoritos.some(favorito => favorito.id === id) //Itera sobre un arreglo y verifica si por lo menos un elemento esta repetido
    }

    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast')
        const toastBody = document.querySelector('.toast-body')
        const toast = new bootstrap.Toast(toastDiv)

        toastBody.textContent = mensaje
        toast.show()
    }

    function cleanHTML(element){
        let elementRemove = document.querySelector(element)
        while(elementRemove.firstChild){
            elementRemove.removeChild(elementRemove.firstChild)
        }
    }

    function showLoader(){
        cleanHTML('#resultado')
        loader.classList.remove('loader-off')
        setTimeout(() => {
            loader.classList.add('loader-off')
        }, 1000)
    }

    //Seccion de Favoritos
    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        if(favoritos.length){
            mostrarRecetas(favoritos) //Re usamos la función
            return
        }

        const noFavoritos = document.createElement('p')
        noFavoritos.textContent = 'No hay favoritos aún'
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5')
        favoritosDiv.appendChild(noFavoritos)
    }

}

document.addEventListener('DOMContentLoaded', iniciarApp)