const docBody = document.body;
const wrapper = document.querySelector('#wrapper');
const searchWrapper = document.querySelector('#outerSearchWrapper');
const searchWrapperStyle = getComputedStyle(searchWrapper); //get style from computed css
const searchAgainWrapper = document.querySelector('#searchAgainWrapper');
const form = document.querySelector('#form');
const searchInput = document.querySelector('#search-text');
const amountInput = document.querySelector('#amount');
const sortInput = document.querySelector('#sortBy');
const errEl = document.querySelector('#error-message');
const imagesContainer = document.querySelector('#images');
const toTopBtn = document.getElementById("toTop");
//serveAPI config
const serverBase = "https://live.staticflickr.com";
const uriSuffix = ".jpg"
//searchAPI config
const apiKey = "7f27f84ea9e7c12c99be353ae3f7b6af";
const flickrBase = "https://www.flickr.com/services/rest/?";
const apiMethod = "flickr.photos.search"; //apiMethod to use,
let currentSearchData = []; //save current search data in this array
let local; //used to check if data requested from flickrAPI or loaded from currentSearchData array
//declare symbols for cleaner code
const divider = "/";
const underscore = "_";
//add eventListeners to formSubmit
form.addEventListener('submit', function(event){
  event.preventDefault();
  loadAni();
  resetSearch(1);
  search(event);
});
//typewriterjs (Loading...) animation runs once only
function loadAni() {
  let searchAgain = document.createElement('div');
  searchAgainWrapper.append(searchAgain);
  searchAgain.id = "searchAgain"; //flickrSearch top logo
  searchAgain = document.querySelector("#searchAgain");
  let typewriter = new Typewriter(searchAgain, {
    loop: false,
    delay: 60
  });
  typewriter
    .typeString('flickrSearch')
    .start();
}
//go to top
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
//add toTopBtn
function toTop() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    toTopBtn.style.display = "block";
  } else {
    toTopBtn.style.display = "none";
  }
}
//function to clear search, used on new search and page changes
function resetSearch(type){
  let reloadLastBtn = document.querySelector("#reloadLastBtn");
  let resetBtn = document.querySelector("#resetBtn");
  let searchAgain = document.querySelector("#searchAgain");
  switch(type){
    case 1: //reset type1- on new search
      docBody.removeEventListener('mousemove', bodyBackground); //remove frontpage lightness change on mouse move
      docBody.style.background = "#0c0a0f"; //reset background color
      searchWrapper.style.display = "none"; //hide searchWrapper
      currentSearchData = []; //clear previously saved search data on new search
    break;
    case 2: //reset type2- bring back search
      searchWrapper.style.display = "block";
      document.body.addEventListener('mousemove', bodyBackground);
      if(searchAgain != null){
        searchAgain.remove();
      }
    break;
    case 3: //reset type3- reload last search
      docBody.removeEventListener('mousemove', bodyBackground); //remove frontpage lightness change on mouse move
      docBody.style.background = "#0c0a0f"; //reset background color
      searchWrapper.style.display = "none"; //hide searchWrapper
    break;
    default:
    if(searchAgain != null){
      searchAgain.remove();
    }
    }
    errEl.innerText= ''; //clear error element
    imagesContainer.innerText = ''; //clear imagesContainer on new search
    let pagination = document.querySelector('#pagination');
    //remove pagination on page change to create new ones
    if(pagination != null){
      pagination.remove();
    }
    if(resetBtn != null){
      resetBtn.remove();
    }
    if(reloadLastBtn != null){
      reloadLastBtn.remove();
    }
}
//function to create resets (button & logo)
function createResets(resetsData){
  let [type, searchData] =  resetsData;
  topFunction();
    switch(type){
      case 1:
      let resetsData = [2, searchData]; //pack data for resets
      let resetBtn = document.createElement('button');
      wrapper.append(resetBtn);
      resetBtn.id = "resetBtn"; //flickrSearch top logo
      resetBtn = document.querySelector("#resetBtn");
      resetBtn.style.display = "block";
      resetBtn.innerText = "✖";
      resetBtn.addEventListener('click', function(){
        resetSearch(2);
        createResets(resetsData);
      });
      let searchAgain = document.querySelector("#searchAgain");
      searchAgain.addEventListener('click', function(){
        resetSearch(2);
        createResets(resetsData);
      });
      break;
      case 2:
      //create reloadSearch button ->
      let reloadLastBtn = document.createElement('button');
      wrapper.append(reloadLastBtn);
      reloadLastBtn.id = "reloadLastBtn"; //flickrSearch top logo
      reloadLastBtn = document.querySelector("#reloadLastBtn");
      reloadLastBtn.style.display = "block";
      reloadLastBtn.innerText = "↺";
      reloadLastBtn.addEventListener('click', function(){
        local = true;
        loadAni();
        resetSearch(3);
        toTop();
        let photoArr = currentSearchData[0].photoArr; //grab first page from array
        searchData.page = 1; //update page to 1
        let data = [photoArr, searchData, local];
        serveImages(data); //serve local page1
      });
      break;
      default:
    }
}
//function to create pagination
function createPag(pagData){
  //unpack pagdata
  let [page, searchData] = pagData;
  //create pagination div
  let pagination = document.createElement('div');
  pagination.id = "pagination";
  wrapper.append(pagination);
  pagination = document.querySelector('#pagination');
  //create btnForward
  let btnForward = document.createElement('button');
  btnForward.id = "btnForward";
  btnForward.innerText = "Next page"
  pagination.append(btnForward);
  btnForward = document.querySelector('#btnForward');
  btnForward.addEventListener('click', function forwardListen(){
    toTop();
    resetSearch();
    loadAni();
    page++;
    //update page in searchData
    searchData.page = page;
    if(currentSearchData.some(function(o){return o["page"] == page;})){
      local = true; //page data exists in local array
      let photoArr = currentSearchData[page-1].photoArr; //grab page from photoArr -1 as array starts from 0 and page counter from 1
      let data = [photoArr, searchData, local];
      serveImages(data);
    } else {
      local = false; //page data does not exist in local array
      flickrAPI(searchData);
    }
  });
  //create btnBack if not first page
  if(page > 1) {
    let btnBack = document.createElement('button');
    btnBack.id = "btnBack";
    btnBack.innerText = "Previous page"
    //insert btnBack before btnForward
    pagination.insertBefore(btnBack, pagination.firstChild);
    btnBack = document.querySelector('#btnBack');
    btnBack.addEventListener('click', function backwardListen(){
      toTop();
      resetSearch();
      loadAni();
      local = true; //always local when going back
      page--;
      //update page in searchData
      searchData.page = page;
      let photoArr = currentSearchData[page-1].photoArr; //grab page photoArr -1 as array starts from 0 and page counter from 1
      let data = [photoArr, searchData, local]; //packdata
      serveImages(data);
    });
  }
  //create pagination selector if pages exist in array
  if(currentSearchData.length >= 1) {
    let pag = document.createElement('select');
    pag.id = "pag";
    pagination.insertBefore(pag, pagination.lastChild);
    pag = document.querySelector('#pag');
    currentSearchData.forEach(page => {
      const option = document.createElement('option');
      page = page.page;
      option.textContent = page;
      option.value = page;
      pag.append(option);
    })
    pag.selectedIndex = page-1;
    pag.addEventListener('change', function changePage(){
      page = pag.selectedIndex+1;
      console.log(`Hopping to page ${page}`);
      toTop();
      resetSearch();
      loadAni();
      local = true; //always local when hopping pages
      let toPage = pag.selectedIndex;
      toPage++;
      searchData.page = toPage; //update pageNr to selected page
      thePage = searchData.page-1;
      let photoArr = currentSearchData[page-1].photoArr; //grab page from photoArr -1 as array starts from 0 and page counter from 1
      let data = [photoArr, searchData, local]; //packdata to serve
      console.log(`Pushing image data for page ${page} from local storage to serveImages() function.`);
      serveImages(data);
    });
  }
}
//search function
function search(event){
    event.preventDefault();
    let page = 1; //start on page1 for new search
    let searchText = searchInput.value; //get searchInput
    searchInput.value = ''; //reset searchInput after grabbing it
    let searchAmount = parseInt(amountInput.value); //get amount & parseInt to remove leading zero's for display purposes
    const sizeInputs = document.getElementsByName('image_size'); //get chosen image size
    sizeInputs.forEach(sizeInput => {
      if(sizeInput.checked){
        return imageSize = sizeInput.value;
      }
    })
    let sortBy = sortInput.value; //get chosen sort by
    let searchData = {}; //create empty array to store search data
    //compile searchData into array for modularity
    searchData = {
      "searchText" : searchText,
      "searchAmount": searchAmount,
      "imageSize": imageSize,
      "sortBy" : sortBy,
      "page": page,
      "apiMethod": apiMethod
    };
    console.log(`Submitting search for ${searchAmount} ${(imageSize == "w") ? "small" : (imageSize == "z") ? "medium" : (imageSize == "b") ? "large" : imageSize} '${searchText}' to flickrAPI() function.`);
    //pass searchData to pull from API include listeners (default: false)
    flickrAPI(searchData);
}
//function to call flickrAPI then pass response
function flickrAPI(searchData){
  local = false; //grabbing data from flickrAPI
  let {searchText, searchAmount, imageSize, sortBy, page, apiMethod} = searchData; //unpack searchData
  const params = new URLSearchParams({
  method: 'flickr.photos.search',
  api_key: apiKey,
  text: searchText,
  per_page: searchAmount,
  sort: sortBy,
  page: page,
  format: 'json',
  nojsoncallback: 1
  });
  fetch(flickrBase+params)
  .then(
      function(response){
        return response.json();
    })
  .then( //process response
      function(response){
        if(response.message != null){ //.message in response on error
          resetSearch(2);
          if(response.message.includes("Parameterless searches have been disabled")){ //incase input required breaks for searchInput handle empty search
            throw new Error("Can not search empty term, please write something to search.");
          }else{ //all else error.message display it
            throw new Error(response.message);
          }
        }
        else if(response === undefined || response.length == 0 || response.photos.photo.length <= 0){ //response when no images found with & without &page= arg
          resetSearch(2);
          if(currentSearchData.length > 0){
            let resetsData = [2, searchData]
            createResets(resetsData);
            throw new Error("no more images found, reload last results or search again.");
          }else {
          throw new Error("no images found, please try another search term.");
          }
        }
        //if is array & there is photo data, return data
        else if(Array.isArray(response.photos.photo) && response.photos.photo != null){
          let photoResponse = response.photos.photo;
          let modifiedPhotoResponse = photoResponse.map(obj => ({...obj, size: imageSize, page: page})); //add requested image size & page nr to photo array
          return [modifiedPhotoResponse, searchData, local]; //return processed response & original searchData for next/prev page function
        }else{ //all else error return response
          resetSearch(2);
          throw new Error(response);
        }
      }
  ).then(serveImages)
  .catch(handleError);
}
//function to serve searchData
function serveImages(data){
  let [photoArr, searchData, local] = data; //unpack data
  let {searchText, searchAmount, imageSize, sortBy, page, apiMethod} = searchData; //unpack searchData
  //check if current page response data saved in array otherwise push to array
  if(!currentSearchData.some(function(o){return o["page"] == page;})){
     currentSearchData.push({page: page, photoArr: photoArr});
  }
  //log data received & if from local or from flickrAPI
  console.log(`Image data for page ${page} received ${(local) ? 'from local storage' : 'from flickrAPI'}.`);
  imageSize = (imageSize == "w") ? "small" : (imageSize == "z") ? "medium" : (imageSize == "b") ? "large" : imageSize ; //rename imageSize to readable property for console.log() usage
  //create imgEl from photoArr received
  photoArr.forEach(image => {
    const img = document.createElement('img');
    imagesContainer.append(img);
    //build imageURI
    imageURI = serverBase
    + divider + image.server
    + divider + image.id
    + underscore + image.secret
    + underscore + image.size
    + uriSuffix;
    img.src = imageURI; //add img src to element
    img.className = imageSize; //set className to imageSize for size specific styling
    img.addEventListener('click', function(event){
      img.style.maxWidth = 'none';
      img.scrollIntoView();
    }, {once: true});
    })
    let searchAgain = document.querySelector("#searchAgain");
    searchAgain.innerText = "flickrSearch"; //stop flickrSearch animation after load by updating .innerText
    //log serveImages result
    console.log(`Displaying search result for ${searchAmount} ${imageSize} '${searchText}' from page ${page} sorted by ${sortBy} ${(local) ? `using locally stored ${apiMethod} response` : `using ${apiMethod} response from flickrAPI`}.`)
    //onScroll events
    window.onscroll = function(event) {
      //add toTopBtn
      toTop();
      toTopBtn.addEventListener('click', topFunction, { once: true });
      //change lightness
      const scrollY = window.scrollY;
      const scrollMod = scrollModifier(scrollY);
      const baseBorder = 90;
      const modifiedBorderL = baseBorder - (scrollMod);
      const baseBg = 5;
      const modifiedBgL = baseBg + (scrollMod*.7);
      const images = document.querySelectorAll('#images img');
      //change every imgBorder lightness- min10%
      images.forEach(image => {
        image.style.borderColor = `hsl(265, 55%, ${(modifiedBorderL>10) ? modifiedBorderL : "10"}%)`;
      })
      //change background lightness- max55%
      document.body.style.background = `hsl(265, 20%, ${(modifiedBgL<55) ? modifiedBgL : "55"}%)`;
    };
    let pagData = [page, searchData]; //pack data for pagination
    let resetsData = [1, searchData]; //pack data for resets
    createPag(pagData);
    createResets(resetsData);
}
//add body listener if searchwrapper present
if(searchWrapperStyle.display == "block"){
  document.body.addEventListener('mousemove', bodyBackground);
}
//change bg lightness based on mouse event.clientY
function bodyBackground(event){
    const lightness = mapLightness(event.clientY);
    document.body.style.backgroundColor = `hsl(265, 20%, ${lightness}%)`
}
//return modified lightness based on mouse event.clientY
function mapLightness(y){
  const maxHeight = window.innerHeight;
  const newLightness = 5 + y/maxHeight * 10;
  return newLightness;
}
//return scroll modifier value
function scrollModifier(scrollY){
  const maxHeight = document.body.scrollHeight;
  const scrollModifier = scrollY/maxHeight*100;
  return scrollModifier;
}
//handle error
function handleError(error){
  let searchAgain = document.querySelector("#searchAgain");
  if(searchAgain != null){
    document.querySelector('#searchAgain').innerText= 'flickrSearch'; //skip ani on error
  }
  resetSearch(2);
    if(typeof error == "undefined"){
      errEl.innerText = "error undefined"; //if error undefined
    }
    else if(typeof error == "string"){
      if(error.includes("Invalid API Key")){ //if apiKey invalid
        errEl.innerText = "Invalid API Key, contact developer or download script and edit 'js/script.js' apiKey variable and run locally.";
      }
    }else if(typeof error != "string"){
      errorString = error.toString();
      if(errorString.includes("Failed to fetch")){ //if connectivity issues to flickr server
        errEl.innerText  = "Could not load flickrAPI to fetch images, please check your connection & try again.";
      } else { //if not string but not failed to fetch, display error message
        errEl.innerText  = errorString;
      }
    }
    else{ //all else, display error message
      errEl.innerText  = error;
    }
}
