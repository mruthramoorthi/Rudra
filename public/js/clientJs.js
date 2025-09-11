document.getElementById('entry-tab').addEventListener('click', function() {
    switchTab('entry','form-for-get-input','for-view-datas');
});

document.getElementById('view-tab').addEventListener('click', function() {
    switchTab('view','for-view-datas','form-for-get-input');
});

function switchTab(tab,statId,nonstatId) {
    // Remove active class from all tabs
    document.querySelectorAll('.main-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to the selected tab
    document.getElementById(tab + '-tab').classList.add('active');
    s(statId)
    h(nonstatId)
}
let altHeld = false;
let numberSequence = '';

document.addEventListener('keydown', (e) => {
  // When Alt is pressed
  if (e.key === 'Alt') {
    altHeld = true;
    numberSequence = ''; // reset previous number sequence
  }

  // While holding Alt, collect digit keys
  if (altHeld && /^\d$/.test(e.key)) {
    numberSequence += e.key;
    e.preventDefault(); // optional: prevent default browser behavior
  }
});

document.addEventListener('keyup', (e) => {
  // When Alt is released
  if (e.key === 'Alt') {
    altHeld = false;

    if (numberSequence) {
      const targetId = 'tab-anchor-' + numberSequence;
      const target = document.getElementById(targetId);

      if (target) {
        target.click();
      }

      numberSequence = ''; // reset after triggering
    }
  }
});

document.addEventListener('keydown', function(event) {
    // Check if Enter key is pressed when a tab is focused
    if (event.target.id == "entry-tab" && event.key === "Enter") {
        switchTab('entry', 'form-for-get-input', 'for-view-datas');
    }
    if (event.target.id == "view-tab" && event.key === "Enter") {
        switchTab('view', 'for-view-datas', 'form-for-get-input');
    }

    // Check if Alt + T is pressed to switch tabs
    if (event.altKey && event.key === 't') {
        // Toggle between Entry and View tabs
        let currentActiveTab = document.querySelector('.main-tab.active').id;
        
        if (currentActiveTab === 'entry-tab') {
            switchTab('view', 'for-view-datas', 'form-for-get-input');
        } else {
            switchTab('entry', 'form-for-get-input', 'for-view-datas');
        }
    }
});

// Create a new keyboard event for 'Alt + T'
const edit_event = new KeyboardEvent('keydown', {
  key: 't',               // Key being pressed
  code: 'KeyT',           // Code of the key (for 'T')
  altKey: true,           // Alt key is pressed
  bubbles: true,          // Event should bubble up
  cancelable: true,       // Event can be canceled
  composed: true          // Event can cross shadow DOM boundaries (if applicable)
});

// Listen for keydown events
document.addEventListener('keydown', (e) => {
  debugger
  if (e.code === 'PageUp') {
    // PageUp pressed → simulate left arrow click
    document.getElementById('left-in')?.click();
  } else if (e.code === 'PageDown') {
    // PageDown pressed → simulate right arrow click
    document.getElementById('right-in')?.click();
  }
});

// Function to switch between tabs
// function switchTabs(tab, contentToShow, contentToHide) {
//     // Remove active class from all tabs
//     document.querySelectorAll('.main-tab').forEach(tabElement => tabElement.classList.remove('active'));
    
//     // Add active class to the selected tab
//     document.getElementById(tab + '-tab').classList.add('active');
    
//     // Hide the previous content and show the new content
//     document.getElementById(contentToHide).style.display = 'none';
//     document.getElementById(contentToShow).style.display = 'block';
// }

// Set default active tab on page load



document.addEventListener("DOMContentLoaded", () => {
  selectLoad('search-page', '/home/loadRightsPage', content = 'application/json', undefined);
  switchTab('entry', 'form-for-get-input', 'for-view-datas');
});

document.querySelectorAll('.click-action').forEach(el => {
    if (!el.hasAttribute('tabindex') && typeof el.focus === 'function') {
        el.setAttribute('tabindex', '0');
    }
});

// sheet click
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.sheetclick').forEach(element => {
        // Add keyboard accessibility
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // prevent scrolling on space
                element.click(); // simulate mouse click
            }
        });
    });
});
// inputData
document.getElementById('search-page').addEventListener('change', function(event) {
  // Call the fetchData function and wait for it to complete
  const fileElements = document.querySelectorAll('.file a'); // Finds all <a> tags inside elements with class .file
  fileElements.forEach(anchor => {
    let temp_ref = anchor.href.split("/masters")[1].replaceAll("/","\\")+".hbs";
    if(event.target.value === temp_ref) // Logs the href attribute of each anchor
      anchor.click();
  });

});
const fullURL = window.location.href;
  const fourDotSpin = `<div class="loading-four">
  <svg class="pl-four" width="240" height="240" viewBox="0 0 240 240">
    <circle class="pl-four__ring pl-four__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 660" stroke-dashoffset="-330" stroke-linecap="round"></circle>
    <circle class="pl-four__ring pl-four__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 220" stroke-dashoffset="-110" stroke-linecap="round"></circle>
    <circle class="pl-four__ring pl-four__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
    <circle class="pl-four__ring pl-four__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
  </svg>
</div>`;
const fourDotSpinDiv = `<div class="loading-div-four">
<svg class="pl-four" width="240" height="240" viewBox="0 0 240 240">
  <circle class="pl-four__ring pl-four__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 660" stroke-dashoffset="-330" stroke-linecap="round"></circle>
  <circle class="pl-four__ring pl-four__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 220" stroke-dashoffset="-110" stroke-linecap="round"></circle>
  <circle class="pl-four__ring pl-four__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
  <circle class="pl-four__ring pl-four__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
</svg>
</div>`;
//   async function focusElementById(elementId) {
//     // Simulate a delay (e.g., waiting for a condition or event)
//     await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

//     // Get the element by its ID
//     var element = document.getElementById(elementId);

//     // Check if the element exists
//     if (element) {
//         element.focus();
//         console.log('Element focused:', elementId);
//     } else {
//         console.log('Element with ID "' + elementId + '" not found.');
//     }
// }

function scrollToElementById(elementId) {
  // Get the target element by ID
  const targetElement = document.getElementById(elementId);

  if (targetElement) {
      // Scroll to the element with smooth behavior
      targetElement.scrollIntoView({
          behavior: 'smooth',   // Smooth scrolling
          block: 'center',      // Scroll to center of the view (can also use 'start' or 'end')
          inline: 'nearest'     // Scroll horizontally if needed (use 'start', 'center', etc.)
      });
  } else {
      console.error("Element with ID '" + elementId + "' not found.");
  }
}

function imageLoader({id, placeholder}) {
  return `
    <div id="uploader_${id}" class='uploaders-img' data-id='${id}'>
    <div>
    <label id="placeholder_${id}" class='image-upload-place' data-id='${id}'>${placeholder}</label>
    <div id="accesser_${id}" class='image-upload-access' data-id='${id}'>
      <div id="options_${id}" class="options" data-id='${id}'>
        <input type="file" id="file-input-for-image_${id}" data-id='${id}' class='file-input-for-image' accept="image/*" multiple />
        <button type="button" data-id='${id}' id="webcam-option_${id}" class='image-upload-web-cam'>Webcam</button>
      </div>
      <div id="drop-zone-for-image_${id}" data-id='${id}' class="drop-zone-for-image"><img src='/images/photo_upload.png' id="upload_img_${id}" data-id='${id}' class='image-upload-upload-img' tabindex="0"/></div>
    </div>
    <div id="label_${id}" data-id='${id}' class='image-upload-label'>Drag & Drop an Image</div>

    <div id="video-container_${id}" data-id='${id}' class='image-upload-video-container'>
      <video id="video_${id}" data-id='${id}' class="image-upload-video" autoplay></video>
      <button type="button" data-id='${id}' id="capture-button_${id}" class='image-upload-capture-button'>Capture Image</button>
      <button type="button" data-id='${id}' id="cancel-vide-button_${id}" class='image-upload-cancel-vide-button'>Cancel</button>
    </div>

    <div id="image-container_${id}" data-id='${id}' class='image-upload-image-container'>
      <button type="button" data-id='${id}' id="rotate_${id}" class='image-upload-rotate'>Rotate</button>
      <button type="button" data-id='${id}' id="square_${id}" class="crop-shape-btn" data-shape="square">Square</button>
      <button type="button" data-id='${id}' id="circle_${id}" class="crop-shape-btn" data-shape="circle">Circle</button>
      <button type="button" data-id='${id}' id="rectangle_${id}" class="crop-shape-btn" data-shape="rectangle">Rectangle</button>
      <button type="button" data-id='${id}' id="ellipse_${id}" class="crop-shape-btn" data-shape="ellipse">Ellipse</button>
      <button type="button" data-id='${id}' id="cancel-crop-button_${id}" class='image-upload-cancel-crop'>Cancel</button>
      <img id="image_${id}" class='image-upload-image' data-id='${id}' src="" alt="Captured Image" style="max-width: 100%;" />
      <button type="button" data-id='${id}' id="crop_${id}" class='image-upload-crop'>Final</button>
    </div>
    <input type="hidden" data-id='${id}' id="imgpath_${id}" name="imgpath_${id}" value="">
    </div>
    <div id="image-gallery_${id}" data-id='${id}'>
      <!-- Cropped images will appear here -->
    </div>

    <canvas id="canvas_${id}" data-id='${id}' style="max-width: 100%; display: none; margin-top: 20px;"></canvas>
    </div>`;
}

function On(id) {
  // Get the input element by its id and set focus
  document.getElementById(id).focus();
}


  document.addEventListener("DOMContentLoaded", () => {
    createTabs();
    // Function to create tabs from the pages stored in localStorage
    function createTabs() {
      const tabsContainer = document.getElementById("tabs");
      const tabContent = document.getElementById("tab-content");
  
      // Retrieve 'pages' from localStorage
      let pages = localStorage.getItem("pages");
      if (pages) {
        pages = pages.split("[vix=2]");
      } else {
        pages = [];
      }
    

      // Clear current tabs
      tabsContainer.innerHTML = "";
      tabContent.innerHTML = "";
      let num = 0
      // Create a tab for each page in the localStorage
      pages.forEach((page, index) => {
        num++;
        const tab = document.createElement("div");
        const label = document.createElement("label");
        tab.classList.add("tab");
        label.classList.add("full-width-l")
        const pageTitle = formatText(page.split("<vrs>")[0]).replaceAll(".", "").replaceAll("-"," ");
        label.innerHTML = "<font class='sno-of-tab'>"+num+"</font>. "+pageTitle;
        tab.appendChild(label);
  
        // const reloadButtonDiv = document.createElement("div");
        // reloadButtonDiv.classList.add("tab-reload-div");
        const reloadButton = document.createElement("img");
        reloadButton.src = "/images/reload.png";
        reloadButton.classList.add("tab-reload");
        tab.appendChild(reloadButton);
        // tab.appendChild(reloadButtonDiv);

        // Add a close button to each tab
        const closeButton = document.createElement("div");
        closeButton.textContent = "×";
        closeButton.classList.add("tab-close");
        tab.appendChild(closeButton);
  
        // Create the anchor tag for the tab
        const anchor = document.createElement("a");
        const pageUrl = page.split("<vrs>")[1];
        anchor.href = pageUrl;
        anchor.classList.add("tab-anchor");
        anchor.id = "tab-anchor-"+num;
        anchor.alt = page.split("<vrs>")[0];
        tab.appendChild(anchor);
  
        // Handle tab click to activate the tab and trigger the anchor click
        reloadButton.addEventListener("click", () => {
          setActiveTab(pageUrl); // Update the tab to active when clicked
          window.location.href = pageUrl; // Update the URL to match the active tab's page
        });
  
        // Handle close button click to remove the tab
        closeButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent tab click event from firing
          removeTab(pageTitle); // Remove the tab from localStorage and UI
        });

        tab.addEventListener("click", (event) => {
          localStorage.setItem("pagesi",localStorage.getItem("pagesi")+"[vix=2]"+page);
          setActiveTab(pageUrl); // Update the tab to active when clicked
          window.location.href = pageUrl; // Update the URL to match the active tab's page
        });
  
        tabsContainer.appendChild(tab);
      });
  
      // If there are pages, set the active tab based on the current URL
      if (pages.length > 0) {
        const currentUrl = window.location.href;
        setActiveTab(currentUrl); // Set the active tab based on the current URL
      }
    }
  
    // Function to set a tab as active based on the URL
    function setActiveTab(pageUrl) {
      const tabs = document.querySelectorAll(".tab");
      const tabContent = document.getElementById("tab-content");
  
      // Remove active class from all tabs
      tabs.forEach(tab => tab.classList.remove("active"));
  
      // Find and activate the tab that matches the page URL
      const activeTab = Array.from(tabs).find(tab => {
        const anchor = tab.querySelector("a");
        return anchor && anchor.href === pageUrl;
      });
  
      if (activeTab) {
        activeTab.classList.add("active");
      }
    }
  
    // Function to remove a tab from localStorage and UI
    function removeTab(pagei) {
      let pages = localStorage.getItem("pages");
      let pagesi = localStorage.getItem("pagesi");
      if (pagesi) {
        pagesi = pagesi.split("[vix=2]");
        const indexi = pagesi.findIndex(p => p.split("<vrs>")[0].replaceAll("-"," ") === pagei.toLowerCase()); // Ensure correct matching
        if (indexi > -1) {
          const splice_pagei = pages[indexi];
          pagesi.splice(indexi, 1); // Remove the page from the array
          const page_Arrayi = pagesi;
          localStorage.setItem("pages", pagesi.join("[vix=2]")); // Save the updated pages back to localStorage
          createTabs(); // Re-render the tabs
          const index_variablei = indexi-1;
          if(window.location.href.split(window.location.origin)[1] == splice_pagei.split("<vrs>")[1] && !!page_Arrayi.length)
            window.location = page_Arrayi[index_variablei].split("<vrs>")[1];
          else if(page_Arrayi.length==0)
            window.location.href = "/home";
        }
      }
      if (pages) {
        pages = pages.split("[vix=2]");
        const index = pages.findIndex(p => p.split("<vrs>")[0].replaceAll("-"," ") === pagei.toLowerCase()); // Ensure correct matching
        if (index > -1) {
          const splice_page = pages[index];
          pages.splice(index, 1); // Remove the page from the array
          const page_Array = pages;
          localStorage.setItem("pages", pages.join("[vix=2]")); // Save the updated pages back to localStorage
          createTabs(); // Re-render the tabs
          const index_variable = index-1;
          if(window.location.href.split(window.location.origin)[1] == splice_page.split("<vrs>")[1] && !!page_Array.length)
            window.location = page_Array[index_variable].split("<vrs>")[1];
          else if(page_Array.length==0)
            window.location.href = "/home";
        }
      }
      if(isEmp(localStorage.getItem("pages")))
        window.location.href = "/home";
    }
  
    // Initialize the tabs when the page loads
    createTabs();
    document.addEventListener('keydown', function(event) {
      // clear the error
        if (event.altKey && event.key === 'r') {
          // Select the div you want to clear
          let notify = document.getElementById('notify-div');
          let danger = document.getElementById('danger-alert');
          // Clear the content of the div
          if (notify)
            notify.innerHTML = '';  // Empty the div
          if(danger)
            danger.innerHTML = '';  // Empty the div
        }
      });
  });
  
  







    // Global variable to track the click count
    let onlineOrOffline = 0;
    let pollingInterval = null; // Global variable to store the interval ID

    // Function to check if the class is present
    function checkClassExistence() {
      const classExists = document.querySelector('.dataTables_wrapper.dt-bootstrap5.no-footer');
      
      if (classExists) {
        // console.log('Class found!');
        return true;
      }
      return false;
    }

    function formatText(input) {
      // Capitalize the first letter of each word
      const capitalizeWords = input
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
    
      // Add proper punctuation (add period if missing)
      const properPunctuation = capitalizeWords.trim();
      if (!properPunctuation.endsWith('.')) {
        return properPunctuation + '.';
      }
      return properPunctuation;
    }

    function caps(inputString) {
      if (!inputString || typeof inputString !== 'string') {
        return ''; // Return an empty string if input is invalid
      }
    
      return inputString
        .split(' ') // Split the string into words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words back into a single string
    }

    function allCaps(inputString) {
      if (!inputString || typeof inputString !== 'string') {
        return ''; // Return an empty string if input is invalid
      }
    
      return inputString.toUpperCase(); // Convert the entire string to uppercase
    }

    // Increment the global variable on click
    function handleClick() {
      onlineOrOffline=1;
      clearInterval(pollingInterval);
      // pollingInterval = null; // Reset the interval ID
    //   console.log('Click count:', onlineOrOffline);
    }

    // Set an interval to continuously check for class existence
    // setInterval(() => {
    //   if (checkClassExistence()) {
    //     // If class exists, listen for clicks and increment the count
    //     document.querySelector('.dataTables_wrapper').addEventListener('click', handleClick);
    //   }
    // }, 1000); // Check every 1 second

    // document.querySelector('.brand').addEventListener('click', function() {
    //     window.location.reload();
    //   });

      let dataTableInstance = null; // Track the DataTable instance

// Initialize DataTable with state-saving and optional polling
async function initializeDataTable(id, route, methods, content = 'application/json', emptymsg = 'No data available', pollingEnabled = 0) {
  try {
    // Fetch the data for the DataTable
    const response = await fetch(route, {
      method: methods,
      headers: { 'Content-Type': content }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    // Store the current page number before updating the table data
    if (dataTableInstance) {
      storePage(dataTableInstance); // Store current page before the table is updated
    }

    // If DataTable is already initialized, update the data
    if (dataTableInstance) {
      // Clear the existing table data and add the new data
      dataTableInstance.clear().rows.add(result.data).draw();
    } else {
      // Initialize DataTable if it hasn't been created yet
      dataTableInstance = $('#' + id).DataTable({
        data: result.data, // Populate DataTable with fetched data
        responsive: true,
        processing: true,
        serverSide: false, // No need for server-side processing
        order: [], // Disable default sorting
        columns: result.columns, // Dynamically use columns from the server
        language: {
          emptyTable: emptymsg
        },
        stateSave: true
      });
    }

    // Restore the page after the table is updated
    restorePage();

     // If polling is enabled, make the request again after a delay
     if (pollingEnabled === 1 && onlineOrOffline === 0) {
      // Clear any existing polling interval before setting a new one
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      pollingInterval = setInterval(() => {
        initializeDataTable(id, route, methods, content, emptymsg, pollingEnabled); // Polling every 5 seconds
      }, 20000); // Every 5 seconds
    }

  } catch (error) {
    console.error('Error initializing DataTable: ', error);
  }
}

// Store the current page before polling (if you need custom handling)
function storePage(table) {
  // Check if the table is initialized before accessing its page
  if (table) {
    const pagei = table.page(); // Get the current page number
    if (!isNaN(pagei)) {
      localStorage.setItem('datatable_page', pagei); // Store it in localStorage
    } else {
      console.error('Failed to retrieve page number.');
    }
  }
}

// Restore the page after polling (this ensures the table stays on the same page after a refresh)
function restorePage() {
  const pagei = parseInt(localStorage.getItem('datatable_page')); // Get the stored page number
  if (!isNaN(pagei) && dataTableInstance) {
    dataTableInstance.page(pagei).draw(false); // Restore the page and redraw the table
  }
}

function valNum(value)
{
  return isNaN(value) || value === undefined || value === null || value === '' || value === 0 ? 0 : parseFloat(value);
}


function isEmp(value)
{
    // Check for null or undefined
    if (value === null || value === undefined) {
        return true;
    }

    // Check for empty string or empty array
    if (typeof value === "string" || Array.isArray(value)) {
        return value.length === 0;
    }

    // Optionally handle objects with no keys
    if (typeof value === "object") {
        return Object.keys(value).length === 0;
    }

    // If none of the above, return false
    return false;
}

async function selectLoad(loadId, route, content = 'application/json', data, callBack)
{
  try {
      const response = await fetch(route, {
        method: 'GET',
        headers: {
          'Content-Type': content,
          'data':data,
        },
      });

      const result = await response.json();
      if (result.success) {
          let functionName = "selectLoad_"+loadId;
          // Get the target element by loadId
          const targetElement = document.getElementById(loadId);
          // Get all options inside the target element
          const options = targetElement.querySelectorAll("option");
          // If there are more than 1 option, remove all except the first one
          if (options.length > 1) {
              // Slice the options starting from index 1, and remove them in one go
              targetElement.innerHTML = options[0].outerHTML; // Keep the first option
              // Append the new response (this will append to the first option)
              targetElement.innerHTML += result.response;
          } else {
              // If only one option exists, just append the response
              targetElement.innerHTML += result.response;
          }
          let existBox = document.getElementById(`custom_dropdown_${loadId}`);
          if (existBox)
          existBox.remove();
          const custom_drop = document.querySelectorAll(`.custom_dropdown_${loadId}`);

          if (custom_drop.length > 0) {
              custom_drop.forEach((custom_dropdown) => {
                createCustomcustom_dropdown(loadId, custom_dropdown);
              });
          }
          if(callBack)
            window[functionName](result);
          return;
      } else {
        document.getElementById("notify-div").innerHTML="<div class='custom-alert "+result.msg_type+"-alert' role='alert'>"+result.msg+"</div>";
        if(result.error)
            document.getElementById("danger-alert").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;"><symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></symbol><symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></symbol><symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></symbol></svg><div class="alert alert-danger d-flex align-items-center" role="alert"><svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg><div>'+result.error+'  </div></div>';
        scrollToElementById("notify-div");
      }
    } catch (error) {
      document.getElementById("danger-alert").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;"><symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></symbol><symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></symbol><symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></symbol></svg><div class="alert alert-danger d-flex align-items-center" role="alert"><svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg><div>'+error+'  </div></div>';
      console.error('Error on backend : ', error);
      // error
    }
}
    
async function backEndCall(id='', route, methods, content = 'application/json', data)
{
  try {
      const response = await fetch(route, {
        method: methods,
        headers: {
          'Content-Type': content,
        },
        body: data,
      });

      const result = await response.json();
      if (result.success) {
          let functionName = "backEndCall_"+id;
          if(isEmp(id))
          {
            // Store the message in sessionStorage
            sessionStorage.setItem('notificationMessage', result.msg);
            sessionStorage.setItem('notificationType', result.msg_type);
            if(result.pdf)
              sessionStorage.setItem('pdf', result.pdf);
            window.location.reload();
          }
          else
          {
            if(result.msg)
              document.getElementById("notify-div").innerHTML="<div class='custom-alert "+result.msg_type+"-alert' role='alert'>"+result.msg+"</div>";
            window[functionName](result);
            return;
          }
      } else {
        document.getElementById("notify-div").innerHTML="<div class='custom-alert "+result.msg_type+"-alert' role='alert'>"+result.msg+"</div>";
        if(result.error)
            document.getElementById("danger-alert").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;"><symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></symbol><symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></symbol><symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></symbol></svg><div class="alert alert-danger d-flex align-items-center" role="alert"><svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg><div>'+result.error+'  </div></div>';
      }
    } catch (error) {
      document.getElementById("danger-alert").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;"><symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></symbol><symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></symbol><symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></symbol></svg><div class="alert alert-danger d-flex align-items-center" role="alert"><svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg><div>'+error+'  </div></div>';
      console.error('Error on backend : ', error);
      // error
    }
}

// When the page reloads, check if there's a stored message in sessionStorage
window.onload = function() {
  const msg = sessionStorage.getItem('notificationMessage');
  const msgType = sessionStorage.getItem('notificationType');
  
  if (msg && msgType) {
    // Append the notification message to the div after reload
    document.getElementById("notify-div").innerHTML = "<div class='custom-alert " + msgType + "-alert' role='alert'>" + msg + "</div>";
    
    // Optionally, remove the message from sessionStorage so it doesn't persist after the next reload
    sessionStorage.removeItem('notificationMessage');
    sessionStorage.removeItem('notificationType');
    sessionStorage.removeItem('pdf');
  }
};

function reloadSite()
{
  window.location.reload();
}

function Id(id)
{
  return document.getElementById(id);
}

function Val(id, att = '', key = '') 
{

  const element = document.getElementById(id);

  if (element) {
    if (att && key) {
      try {
        return JSON.parse(element.getAttribute(att))[key];
      } catch (error) {
        console.error('Error parsing JSON or accessing key:', error);
        return null;
      }
    } else if (att) {
      try {
        return JSON.parse(element.getAttribute(att));
      } catch (e) {
        try {
          return element.getAttribute(att);
        }
        catch (error) {
          console.error('Error parsing JSON:', error);
          return null;
        }
      }
    } else {
      return element.value;
    }
  }
  else {
    console.error(`No element found with id: ${id}`);
    return null;
  }
}

function control_calc(type,amount,value,rate)
{
//   // Validate input types
//   if (typeof type !== 'string' || (type !== 'perc' && type !== 'amt')) {
//     throw new Error('Type must be either "perc" or "amt" as a string');
//   }

//   if (typeof amount !== 'number' || isNaN(amount)) {
//     throw new Error('Amount must be a valid number');
//   }

//   if (typeof value !== 'number' || isNaN(value)) {
//     throw new Error('Value must be a valid number');
//   }

//   if (typeof rate !== 'number' || isNaN(rate)) {
//     throw new Error('Value must be a valid number');
//   }
  // try {
  //   if (type === "perc") {
  //     gram = parseFloat(valNum(amount / 100)) * parseFloat(valNum(value));
  //     total = parseFloat(valNum(gram)) * parseFloat(valNum(rate));
  //   } else if (type === "amt") {
  //     total = parseFloat(valNum(amount)) * parseFloat(valNum(value));
  //   }
  // } catch (error) {
  //   throw new Error(`Calculation error: ${error.message}`);
  // }

  // return total;
}

function Ss(id, val, triggerClick = 1) {
  // Select all elements with the class custom_dropdown-menu-item_
  const elements = document.querySelectorAll('.custom_dropdown-menu-item_' + id);
  try {
    // Loop through each element
    if(triggerClick==1)
      elements.forEach((element) => {
        // Get the data-value attribute of the current element
        const dataValue = element.getAttribute('data-value');
        
        // Check if data-value exists and if it matches the provided val
        if (dataValue !== null && dataValue == val) {
          // Only click if triggerClick is 1, otherwise just select/find the element
          if (triggerClick == 1) {
            element.click();
          }
          // You might want to do something else here when not clicking,
          // like adding a 'selected' class or similar
        }
      });
    else
    {
      Si("custom_dropdown-select_"+id,val);
      Sv(id,val);
    }
  } catch (error) {
    console.error('Error in Ss:', error);
    return;
  }
}
      
function Sv(id, val) {
  const element = document.getElementById(id);
  
  try {
    // Set the value of the element
    element.value = val;
    
    // Trigger the events manually
    
    // Trigger onchange event
    // var changeEvent = new Event('change');
    // element.dispatchEvent(changeEvent);
    
    // Trigger input event
    // var inputEvent = new Event('input');
    // element.dispatchEvent(inputEvent);
    
    // Trigger click event (if you want to simulate a click)
    // var clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    // element.dispatchEvent(clickEvent);
    
    // Trigger keyup event (you can customize the key as needed)
    // var keyupEvent = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter' });
    // element.dispatchEvent(keyupEvent);
    
  } catch (error) {
    console.error('Error in Sv :', error);
    return;
  }
}

function getHtml(id)
{
  const element = document.getElementById(id);
  try {
    return element.innerHTML;
  } catch (error) {
    console.error('Error in get html:', error);
    return;
  }
}

function Sa(id, newid, text) {
  const element = document.getElementById(id);
  const newDiv = document.createElement('div');
  // Set attributes for the new div if needed
  newDiv.id = newid;  // You can set any attributes like ID, class, etc.
  newDiv.innerHTML = text;
  try {
      // Append text to the existing content
      element.appendChild(newDiv);
  } catch (error) {
      console.error('Error in appendContent:', error);
      return;
  }
}

function Sat(id, newid, text) {
  const element = document.getElementById(id);
  const newDiv = document.createElement('tr');
  // Set attributes for the new div if needed
  newDiv.id = newid;  // You can set any attributes like ID, class, etc.
  newDiv.innerHTML = text;
  try {
      // Append text to the existing content
      element.appendChild(newDiv);
  } catch (error) {
      console.error('Error in appendContent:', error);
      return;
  }
}


function Si(id, text)
{
  const element = document.getElementById(id);
  try {
    element.innerHTML="";
    element.innerHTML=text;
  } catch (error) {
    console.error('Error in si:', error);
    return;
  }
}

function Sii(id, text)
{
  const element = document.getElementById(id);
  try {
    element.innerHTML=element.innerHTML+text;
  } catch (error) {
    console.error('Error in si:', error);
    return;
  }
}

function addClass(id, className) {
  const element = document.getElementById(id);
  
  if (element && !element.classList.contains(className)) {
    element.classList.add(className);
  } else {
    console.error(`Element with ID "${id}" not found or class "${className}" already exists.`);
  }
}

function removeClass(id, className) {
  const element = document.getElementById(id);
  
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    console.error(`Element with ID "${id}" not found or class "${className}" doesn't exist.`);
  }
}

function Sb(id, property) {
  // Get the element by its ID
  const element = document.getElementById(id);
  
  if (element) {
    // Set the given property to 'none' or '' (clear it)
    element.style.background = property;
  } else {
    console.error(`Element with ID ${id} not found.`);
  }
}

      
document.addEventListener("DOMContentLoaded", () => {
  // Select all elements with the class 'file'
  const fileElements = document.querySelectorAll(".file");

  // Iterate over each .file element and add the click event listener
  fileElements.forEach((file) => {
    file.addEventListener("click", () => {
      // Select the <a> element inside the current clicked .file and get its href attribute
      const link = file.querySelector("a");

      // Get the href attribute if the <a> element exists
      if (link) {
        const href = link.getAttribute("href");
        // Get the current 'pages' from localStorage, or initialize it as an empty string if not set
        let new_pages = localStorage.getItem('pages');
        const pageName = link.getAttribute("alt");  // Get the last part of the URL as 'name'

        // If 'new_pages' is null or empty, initialize it with the first page and its link
        if (!new_pages) {
          new_pages = pageName + "<vrs>" + href;
        } else {
          // Split the 'new_pages' to check if the pageName exists
          let check_Arr = new_pages.split("[vix=2]");
          const index = check_Arr.findIndex(page => page.split("<vrs>")[0] === pageName);
          
          if (index > -1) {
            // If the page exists, remove it and add the new one
            check_Arr.splice(index, 1);
          }
          
          // Append the new page with the URL, separated by <vrs>
          check_Arr.push(pageName + "<vrs>" + href );
          
          // Update 'new_pages' with the modified pages list
          new_pages = check_Arr.join("[vix=2]");
        }

        // Save the updated 'new_pages' to localStorage
        localStorage.setItem('pages', new_pages);
        localStorage.setItem('pagesi', new_pages);
      }
    });
  });
});

function getFormData(id) {
  const form = document.getElementById("form-for-get-input");

  if (!form) {
    console.error('Form not found!');
    return '{}';  // Return an empty JSON string if the form is not found
  }

  // Create a new FormData object from the form
  const formData = new FormData(form);

  // Convert FormData to a plain object for easy manipulation
  const formObject = {};
  formData.forEach((value, key) => {
    formObject[key] = value;
  });

  // Convert the object to a JSON string and return
  return JSON.stringify(formObject);  // Return JSON string
}

function setForm(id,action,method)
{
  const form = document.getElementById(id);

  // Set the action and method attributes
  form.action = action;  // URL where the form will be submitted
  form.method = method;  // The HTTP method to be used for the submission
}

// Creating a dynamic global variable
function createGlobalVariable(key, value) {
  // Assign the variable dynamically to the global window object
  window[key] = value;
}

let originalRows = [];  // Array to store the original rows

function searchTable(id) {
  let input = document.getElementById('searchInput' + id);
  let filter = input.value.toLowerCase();
  let table = document.getElementById("lazy-tables" + id);
  let rows = table.getElementsByTagName('tr');

  let rowsArray = Array.from(rows).slice(1); // Skip the header row

  // If originalRows is empty, store the initial rows
  if (originalRows.length === 0) {
    originalRows = rowsArray.map(row => row.cloneNode(true));
  }

  // If search field is empty, reset to the original rows and return
  if (filter === "") {
    let tbody = document.getElementById(id);
    tbody.innerHTML = "";
    originalRows.forEach(row => tbody.appendChild(row));
    return;
  }

  // Arrays to store matched and non-matched rows
  let matchedRows = [];
  let nonMatchedRows = [];

  rowsArray.forEach(function(row) {
    let cells = row.getElementsByTagName('td');
    let matched = false;

    // Check if any cell contains the search term (case-insensitive)
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      if (cell.innerHTML.toLowerCase().includes(filter)) {
        matched = true;
        break;
      }
    }

    // If matched, add to matchedRows, else add to nonMatchedRows
    if (matched) {
      matchedRows.push(row);
    } else {
      nonMatchedRows.push(row);
    }
  });

  // Sort matched rows based on priority
  // This step ensures that matching rows that contain the search term are at the top
  matchedRows.sort((a, b) => {
    let aCells = a.getElementsByTagName('td');
    let bCells = b.getElementsByTagName('td');
    let aMatchCount = 0;
    let bMatchCount = 0;

    // Count how many cells in each row match the search term
    Array.from(aCells).forEach(cell => {
      if (cell.innerHTML.toLowerCase().includes(filter)) aMatchCount++;
    });
    Array.from(bCells).forEach(cell => {
      if (cell.innerHTML.toLowerCase().includes(filter)) bMatchCount++;
    });

    // Rows with more matches should come first (ascending priority)
    return bMatchCount - aMatchCount; // Descending order (more matches come first)
  });

  // Clear the table body and add the matched and non-matched rows back in the desired order
  let tbody = document.getElementById(id);
  tbody.innerHTML = "";  // Clear current rows

  // Append matched rows first and then non-matched rows
  matchedRows.forEach(row => tbody.appendChild(row));
  nonMatchedRows.forEach(row => tbody.appendChild(row));
}

// let lazy_content, lazy_limit, lazy_page, lazy_loadingId, lazy_loadingHyml, lazy_router, lazy_style, lazy_hasMoreData, lazy_appendId, lazy_data, lazy_Thead, lazy_Tfoot = null;
  // Function to fetch data from the backend
async function fetchTableData(contentId, limit, page, loadingId, loadingHtml, router, style, appendDivId, datas="", thead, tfoot, classs="") {
debugger
  if(!loadingHtml)
    loadingHtml = fourDotSpin;
    var divElement = document.getElementById(contentId);
    const thCount = (thead.match(/<th\b[^>]*>/gi) || []).length;
      let lazyTable = `<div id="lazy-content-div">
      <div class="search-container">
      </div><br><div class='laz-table-contain'><table id='lazy-tables${contentId}' class="laz-tbl table-bordered ${classs}">
      <thead class='thead-lazy'>
      <tr>
      <td colspan='${thCount}'>
      <div class='lazy_statistics'>
        <label>Total: 
          <font id='lazy_total_datas${contentId}' name='lazy_total_datas${contentId}'></font>
        </label>
        <div>
          <label>Needed Records</label>
          <input type='number' class='lazy_inputs' id='lazy_needed_to_load${appendDivId}' name='lazy_needed_to_load${appendDivId}' value='`+limit+`'>
        </div>
        <input type="text" id="searchInput${contentId}" class="search-inputs" placeholder="Search...">
        <label>Loaded: 
          <font id='lazy_total_loaded${contentId}' name='lazy_total_loaded${contentId}'></font>
        </label>
      </div>
      </td>
      </tr>
      <tr>${thead}</tr></thead><tbody id="${contentId}" class="tbody-lazy"></tbody><tfoot id="foot${contentId}" class="tfoot-lazy">${tfoot}</tfoot></table></div></div>`;    

      if(!divElement)
        document.getElementById(appendDivId).innerHTML = lazyTable;
      let loading = false;        // To prevent multiple requests at once
      let hasMoreData = true;     // Flag to check if more data is available

      const loadingElement = document.getElementById(loadingId);

      if (loading || !hasMoreData) return;  // Prevent multiple requests or unnecessary ones if no data
      if(loadingHtml!='no')
      {
        loading = true;
        loadingElement.innerHTML = loadingHtml;  // Show loading indicator with the custom message
      }

      try {
          const response = await fetch(router, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ page, limit, datas })
          });

          const data = await response.json();

          if (data.success) {
              loading = false;
              loadingElement.innerHTML = "";
              const contentContainer = document.getElementById(contentId);
              contentContainer.innerHTML += data.response.split("[tdfooter]")[0];  // Append new data to the content
              const FootcontentContainer = document.getElementById("foot"+contentId);
              if(data.response.split("[tdfooter]")[1])
              FootcontentContainer.innerHTML = data.response.split("[tdfooter]")[1];  // Append new data to the content
              let parser = new DOMParser();
              let doc = parser.parseFromString(`<table id='lazy-table${contentId}'>`+data.response+`</table>`, 'text/html');
              // Get all <tr> elements within the parsed content
              let trElements = doc.querySelectorAll('tr');
              // Find the total number of <tr> elements
              let totalRows = trElements.length;
              Si("lazy_total_loaded"+contentId, totalRows);
              Si("lazy_total_datas"+contentId, data.total);
              page++;  // Increment the page for the next request


              // Get all inputs with class 'search-inputs'
              const searchInputs = document.querySelectorAll('.search-inputs');
              // Add 'keyup' event listener to each input field
              searchInputs.forEach(input => {
                input.addEventListener('keyup', function(event) {
                  const id = event.target.id.replace("searchInput","");
                  searchTable(id)
                });
              });  



          }

          // If no data was returned, it means there's no more data to load
          if (data.response.trim() === '') {
              hasMoreData = false;
              lazy_hasMoreData = false;
          }
      } catch (error) {
          console.error('Error fetching data:', error);
      } finally {
          loading = false;
          // if(loadingId!=contentId)
          // loadingElement.innerHTML = '';  // Clear loading indicator
      }
      
      createGlobalVariable('lazy_content'+appendDivId, contentId);
      createGlobalVariable('lazy_limit'+appendDivId, limit);
      createGlobalVariable('lazy_page'+appendDivId, page);
      createGlobalVariable('lazy_loadingId'+appendDivId, loadingId);
      createGlobalVariable('lazy_loadingHyml'+appendDivId, loadingHtml);
      createGlobalVariable('lazy_router'+appendDivId, router);
      createGlobalVariable('lazy_style'+appendDivId, style);
      createGlobalVariable('lazy_appendId'+appendDivId, appendDivId);
      createGlobalVariable('lazy_Thead'+appendDivId, thead);
      createGlobalVariable('lazy_data'+appendDivId, datas);
      createGlobalVariable('lazy_Tfoot'+appendDivId, tfoot);
      createGlobalVariable('lazy_class'+appendDivId, classs);
  };

  function lazy_table_Loading(lazyContenId)
  {
    const lazyContentElement = document.getElementById(lazyContenId);
    if (lazyContentElement.scrollTop + lazyContentElement.clientHeight >= lazyContentElement.scrollHeight - 100) {
      // If the user is 100px from the bottom, fetch the next set of data
      fetchTableData(window["lazy_content"+lazyContenId], window["lazy_limit"+lazyContenId], window["lazy_page"+lazyContenId], window["lazy_loadingId"+lazyContenId], window["lazy_loadingHyml"+lazyContenId], window["lazy_router"+lazyContenId], window["lazy_style"+lazyContenId], window["lazy_appendId"+lazyContenId], window["lazy_data"+lazyContenId], window["lazy_Thead"+lazyContenId], window["lazy_Tfoot"+lazyContenId], window["lazy_classs"+lazyContenId]);
    }
  }

  // let lazy_div_content, lazy_div_limit, lazy_div_page, lazy_div_loadingId, lazy_div_loadingHyml, lazy_div_router, lazy_div_style, lazy_div_hasMoreData, lazy_div_appendId, lazy_div_data = null;
  // Function to fetch data from the backend
async function fetchDivData(contentId, limit, page, loadingId, loadingHtml, router, style, appendDivId, datas="") {
debugger
if(!loadingHtml)
  loadingHtml = "fourDotSpinDiv";
  var divElement = document.getElementById(contentId);

      let lazyTable = `<div id="lazy-content-div"><div class='lazy_statistics'><label>Total: <font id='lazy_total_datas${contentId}' name='lazy_total_datas${contentId}'></font></label><div><label>Needed Records</label><input type='number' class='lazy_inputs' id='lazy_needed_to_load${appendDivId}' name='lazy_needed_to_load${appendDivId}' value='`+limit+`'></div><label>Loaded: <font id='lazy_total_loaded${contentId}' name='lazy_total_loaded${contentId}'></font></label></div><br><div id="lazy-content-div${contentId}"><div id="${contentId}"></div></div>`;
      if(!divElement)
        document.getElementById(appendDivId).innerHTML = lazyTable;
      let loading = false;        // To prevent multiple requests at once
      let hasMoreData = true;     // Flag to check if more data is available

      const loadingElement = document.getElementById(loadingId);

      if (loading || !hasMoreData) return;  // Prevent multiple requests or unnecessary ones if no data

      loading = true;
      loadingElement.innerHTML = loadingHtml;  // Show loading indicator with the custom message

      try {
          const response = await fetch(router, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ page, limit, datas })
          });

          const data = await response.json();

          if (data.success) {
              loading = false;
              loadingElement.innerHTML = "";
              const contentContainer = document.getElementById(contentId);
              contentContainer.innerHTML += data.response;  // Append new data to the content
              let parser = new DOMParser();
              let doc = parser.parseFromString(`<div id='${contentId}'>`+data.response+`</div>`, 'text/html');
              // Get all <tr> elements within the parsed content
              let trElements = doc.querySelectorAll('.snowdiv.paginate');
              // Find the total number of <tr> elements
              let totalRows = trElements.length;
              Si("lazy_total_loaded"+contentId, totalRows);
              Si("lazy_total_datas"+contentId, data.total);
              page++;  // Increment the page for the next request
          }

          // If no data was returned, it means there's no more data to load
          if (data.response.trim() === '') {
              hasMoreData = false;
              lazy_div_hasMoreData = false;
          }
      } catch (error) {
          console.error('Error fetching data:', error);
      } finally {
        loading = false;
        // if(loadingId!=contentId)
        // loadingElement.innerHTML = '';  // Clear loading indicator
      }

      createGlobalVariable('lazy_content'+appendDivId, contentId);
      createGlobalVariable('lazy_limit'+appendDivId, limit);
      createGlobalVariable('lazy_page'+appendDivId, page);
      createGlobalVariable('lazy_loadingId'+appendDivId, loadingId);
      createGlobalVariable('lazy_loadingHyml'+appendDivId, loadingHtml);
      createGlobalVariable('lazy_router'+appendDivId, router);
      createGlobalVariable('lazy_style'+appendDivId, style);
      createGlobalVariable('lazy_appendId'+appendDivId, appendDivId);
      createGlobalVariable('lazy_data'+appendDivId, datas);
  };

  function lazy_div_Loading(lazyContenId)
  {
    const lazyContentElement = document.getElementById(lazyContenId);
    if (lazyContentElement.scrollTop + lazyContentElement.clientHeight >= lazyContentElement.scrollHeight - 100) {
      // If the user is 100px from the bottom, fetch the next set of data
      fetchTableData(window[lazy_content+lazyContenId], window[lazy_limit+lazyContenId], window[lazy_page+lazyContenId], window[lazy_loadingId+lazyContenId], window[lazy_loadingHyml+lazyContenId], window[lazy_router+lazyContenId], window[lazy_style+lazyContenId], window[lazy_appendId+lazyContenId], window[lazy_data+lazyContenId]);
    }
  }

  function loadImg(id, path) {
    const gallery = document.getElementById("image-gallery_" + id);
    const imgPathInput = document.getElementById("imgpath_" + id); // Hidden input

    // Create image container
    const imageItem = document.createElement("div");
    imageItem.classList.add(`image-item_${id}`);
    imageItem.classList.add(`image-upload-image-item`);
    // Create image element
    const img = document.createElement("img");
    img.src = path;

    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add(`delete-btn_${id}`);
    deleteBtn.classList.add('image-upload-delete-btn');
    deleteBtn.textContent = "X";

    // Add delete functionality
    deleteBtn.onclick = () => {
        // Remove the image from the gallery
        imageItem.remove();

        // Get current image paths from the hidden input
        let paths = imgPathInput.value ? imgPathInput.value.split("[pics~pics]") : [];

        // Remove the deleted image path
        paths = paths.filter(p => p.trim() !== path.trim());

        // Update the hidden input field with remaining paths
        imgPathInput.value = paths.length > 0 ? paths.join("[pics~pics]") : "";
    };

    // Append elements
    imageItem.appendChild(img);
    imageItem.appendChild(deleteBtn);
    gallery.appendChild(imageItem);

    // Update the hidden input value with the new image path
    let currentPaths = imgPathInput.value ? imgPathInput.value.split("[pics~pics]") : [];

    // Avoid duplicate entries
    if (!currentPaths.includes(path)) {
        currentPaths.push(path);
    }

    imgPathInput.value = currentPaths.join("[pics~pics]");
}

// Define the rawDateFormat function
function rawDateFormat(dateString, format='ymd',split='/') {
  // Ensure the date string is valid
  const date = new Date(dateString);
  if (isNaN(date)) {
    console.error("Invalid date:", dateString);
    return undefined; // Return undefined if the date is invalid
  }

  // Extract the day, month, and year
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
  const year = date.getFullYear();
    // Return the formatted date
if(format==="ymd")
  return `${year}${split}${month}${split}${day}`;
else if(format==="dmy")
  return `${day}${split}${month}${split}${year}`;
}

// (function() {
//   // Function to check if DevTools is open by detecting the window resize
//   function isDevToolsOpen() {
//       const threshold = 160; // A threshold to detect the change in the window size when dev tools open
//       let widthThreshold = window.outerWidth - window.innerWidth > threshold;
//       let heightThreshold = window.outerHeight - window.innerHeight > threshold;

//       return widthThreshold || heightThreshold;
//   }

//   // Reload the page if DevTools is detected
//   function checkDevTools() {
//       if (isDevToolsOpen()) {
//           window.location = '/auth/logout'; // Reload the page
//       }
//   }

//   // Use a periodic check (every 500ms or adjust as necessary)
//   setInterval(checkDevTools, 500);
// })();

// (function() {
//   let devToolsDetected = false;

//   // Try to trigger the debugger, and see if the browser pauses execution
//   function checkDevTools() {
//       const startTime = Date.now();
//       debugger; // This will trigger a pause in DevTools if it's open
//       const endTime = Date.now();
      
//       if (endTime - startTime > 100) { // If it takes too long, DevTools might be open
//           if (!devToolsDetected) {
//               devToolsDetected = true;
//               window.location = '/auth/logout'; // Reload the page when DevTools is detected
//           }
//       } else {
//           devToolsDetected = false;
//       }
//   }

//   // Check for DevTools every 500ms
//   setInterval(checkDevTools, 500);
// })();


function createCustomcustom_dropdown(id, custom_dropdown) {
  const options = custom_dropdown.querySelectorAll("option");
  const optionsArr = Array.prototype.slice.call(options);

  const customcustom_dropdown = document.createElement("div");
  customcustom_dropdown.classList.add("custom_dropdown_"+id);
  customcustom_dropdown.setAttribute("id", "custom_dropdown_"+id);
  customcustom_dropdown.setAttribute("tabindex", "0");
  custom_dropdown.insertAdjacentElement("afterend", customcustom_dropdown);

  const flex_div = document.createElement("div");
  flex_div.classList.add("display_dropdown", "custom_flex_div_"+id);
  customcustom_dropdown.appendChild(flex_div);

  const selected = document.createElement("div");
  selected.setAttribute("id", "custom_dropdown-select_"+id);
  selected.classList.add("custom_dropdown-select_"+id);
  selected.textContent = optionsArr[0].textContent;
  flex_div.appendChild(selected);

  const arrow_div = document.createElement("div");
  arrow_div.classList.add("custom_arrow_div_"+id);
  flex_div.appendChild(arrow_div);
  const down_Arr = document.createElement('img');
  down_Arr.src="https://cdn-icons-png.flaticon.com/512/2722/2722987.png";
  down_Arr.style.width = "15px";
  arrow_div.appendChild(down_Arr);

  const menu = document.createElement("div");
  menu.classList.add("custom_dropdown-menu_"+id);
  customcustom_dropdown.appendChild(menu);

  const search = document.createElement("input");
  search.placeholder = "Search...";
  search.type = "text";
  search.classList.add("custom_dropdown-menu-search_"+id);
  menu.appendChild(search);

  const menuInnerWrapper = document.createElement("div");
  menuInnerWrapper.classList.add("custom_dropdown-menu-inner_"+id);
  menu.appendChild(menuInnerWrapper);

  optionsArr.forEach((option, index) => {
      const item = document.createElement("div");
      item.classList.add("dropdown_items", "custom_dropdown-menu-item_"+id);
      item.dataset.value = option.value;
      item.textContent = option.textContent;

      // Check if the option is disabled and apply the disabled class
      if (option.disabled) {
          item.classList.add("disabled");
          item.setAttribute("tabindex", "-1"); // Make the item non-focusable
      }

      menuInnerWrapper.appendChild(item);
      
      // Only add event listener to enabled items
      if (!option.disabled) {
        item.addEventListener("click", () => setSelected(item, selected, custom_dropdown, menu));
      }

      item.dataset.index = index;
  });

  menuInnerWrapper.querySelector("div").classList.add("selected");

  search.addEventListener("input", (event) => filterItems(id, optionsArr, menu, event));
  document.addEventListener("click", (event) => closeIfClickedOutside(id, customcustom_dropdown, menu, event));
  custom_dropdown.style.display = "none";

  // Add event listeners for arrow keys, enter key, and tabbing
  customcustom_dropdown.addEventListener("focus", openMenu.bind(id, selected, menu));
  // customcustom_dropdown.addEventListener("keydown", (event) => handleKeyboardNavigation(id, menu, event));
  menu.addEventListener("keydown", (event) => handleKeyboardNavigation(id, menu, event));
}

function openMenu(id, menu) {
  menu.style.display = "block";
  menu.querySelector("input").focus();
}

function setSelected(item, selected, custom_dropdown, menu) {
  const value = item.dataset.value;
  const label = item.textContent;
  selected.textContent = label;
  custom_dropdown.value = value;
  // Create a new 'change' event
  var event = new Event('change');
  // Dispatch the event to trigger the change handler
  custom_dropdown.dispatchEvent(event);
  menu.style.display = "none";
  menu.querySelector("input").value = "";
  menu.querySelectorAll("div").forEach((div) => {
      div.classList.remove("is-select");
  });
  item.classList.add("is-select");
}


function handleKeyboardNavigation(id, menu, event) {
  const items = Array.from(menu.querySelectorAll(".custom_dropdown-menu-item_" + id))
                      .filter(item => item.style.display !== "none" && getComputedStyle(item).display !== "none"); // Filter out hidden items
  let selectedItem = menu.querySelector(".custom_dropdown-menu-item_" + id + ".is-select");
  let selectedIndex = selectedItem ? items.indexOf(selectedItem) : -1;

  // Handle arrow up
  if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length; // Move up
  } 
  // Handle arrow down
  else if (event.key === "ArrowDown") {
    event.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length; // Move down
  } 
  // Handle Enter key (select item)
  else if (event.key === "Enter") {
    event.preventDefault();
    if (selectedItem) {
        selectedItem.click();
    }
    return;
  } 
  // Handle Tab key (move focus to the previous element)
  else if (event.key === "Tab" && event.shiftKey) {
    // Handle Shift + Tab
    event.preventDefault();
    menu.style.display = "none";
    focusPreviousElement(menu);
    return;
  } 
  // Handle regular Tab key (move focus out of the menu)
  else if (event.key === "Tab") {
    menu.style.display = "none";
    return;
  }

  // Update selected item in the menu
  if (selectedItem) {
    selectedItem.classList.remove("is-select");
  }

  const newSelectedItem = items[selectedIndex];
  newSelectedItem.classList.add("is-select");

  // Scroll to the selected item if needed
  menu.querySelector(".custom_dropdown-menu-inner_" + id).scrollTop =
    newSelectedItem.offsetTop - menu.querySelector(".custom_dropdown-menu-inner_" + id).offsetTop;
}


function focusPreviousElement(menu) {
  // Close the current menu
  menu.style.display = "none";
  
  // Find all dropdown search inputs
  const allSearchInputs = Array.from(document.querySelectorAll('[class*="custom_dropdown-menu-search_"]'));
  
  // Find the index of the current search input
  const currentInput = document.activeElement;
  const currentIndex = allSearchInputs.indexOf(currentInput);
  
  if (currentIndex > 0) {
    // Focus on the previous search input
    const previousInput = allSearchInputs[currentIndex - 1];
    
    // Find the parent dropdown menu and show it
    const previousMenu = previousInput.closest('[class*="custom_dropdown-menu_"]');
    if (previousMenu) {
      previousMenu.style.display = 'block';
    }
    
    previousInput.focus();
  } else {
    // If no previous search input, focus on the dropdown toggle button
    const dropdowns = Array.from(document.querySelectorAll('[class*="custom_dropdown_"]'));
    const currentDropdownIndex = dropdowns.indexOf(menu.closest('[class*="custom_dropdown_"]'));
    
    if (currentDropdownIndex > 0) {
      const previousDropdown = dropdowns[currentDropdownIndex - 1];
      previousDropdown.focus();
    }
  }
}





function filterItems(id, itemsArr, menu, event) {
  const customOptions = menu.querySelectorAll(".custom_dropdown-menu-inner_"+id+" div");
  const value = event.target.value.toLowerCase();

  // Use textContent for filtering
  const filteredItems = itemsArr.filter((item) =>
      item.textContent.toLowerCase().includes(value)
  );

  const indexesArr = filteredItems.map((item) => itemsArr.indexOf(item));

  itemsArr.forEach((option) => {
      const index = itemsArr.indexOf(option);
      if (!indexesArr.includes(index)) {
          customOptions[index].style.display = "none";
      } else {
          customOptions[index].style.display = "block";
      }
  });
}

function filterItems_value(id, itemsArr, menu) {
  const customOptions = menu.querySelectorAll(".custom_dropdown-menu-inner_"+id+" div");
  const value = this.value.toLowerCase();
  const filteredItems = itemsArr.filter((item) =>
      item.value.toLowerCase().includes(value)
  );
  const indexesArr = filteredItems.map((item) => itemsArr.indexOf(item));

  itemsArr.forEach((option) => {
      if (!indexesArr.includes(itemsArr.indexOf(option))) {
          customOptions[itemsArr.indexOf(option)].style.display = "none";
      } else {
          if (customOptions[itemsArr.indexOf(option)].offsetParent === null) {
              customOptions[itemsArr.indexOf(option)].style.display = "block";
          }
      }
  });
}

function closeIfClickedOutside(id, customcustom_dropdown, menu, event) {
  // Check if the clicked element is outside the custom dropdown
  if (
      !event.target.closest(".custom_dropdown_" + id) && 
      event.target !== customcustom_dropdown && 
      menu.offsetParent !== null
  ) {
      menu.style.display = "none";
  }
}

function searchableSelect(clickedId)
{
  // document.addEventListener("click", (event) => {
  //   const clickedId = event.target.id;
  //   if(event.target.classList.contains(clasname))
  //   {
       const custom_drop = document.querySelectorAll(`.custom_dropdown_${clickedId}`);
       if (custom_drop.length > 0) {
          custom_drop.forEach((custom_dropdown) => {
             createCustomcustom_dropdown(clickedId, custom_dropdown);
          });
       }
//     }
//  });
}


document.addEventListener('DOMContentLoaded', function () {
  // Select all checkboxes with the 'custom-checkbox' class
  const checkboxes = document.querySelectorAll('.custom-checkbox input[type="checkbox"]');
  const checkboxesSpans = document.querySelectorAll('.custom-checkbox .checkbox');
  
  // Loop through all the checkboxes and add the event listeners
  checkboxes.forEach((checkbox, index) => {
    const checkboxSpan = checkboxesSpans[index];
    
    // Ensure that pressing Enter when the checkbox is focused triggers a toggle (like a click)
    checkbox.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        checkbox.click(); // Simulate a click on the checkbox
      }
        checkboxSpan.addEventListener('click', function () {
          checkbox.checked = !checkbox.checked; // Manually toggle the checkbox state
          checkbox.dispatchEvent(new Event('change')); // Trigger the change event if needed
        });
    
        // Ensure clicking the checkbox itself works too
        checkbox.addEventListener('click', function () {
          checkbox.checked = !checkbox.checked; // Manually toggle the checkbox state if checkbox itself is clicked
          checkbox.dispatchEvent(new Event('change')); // Trigger the change event if needed
        });
    });
    // Add a click handler to the custom span to toggle the checkbox's state
  });
  document.querySelectorAll('.input-radio').forEach((radioButton) => {
      radioButton.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
              radioButton.checked = true;  // Select the radio button when 'Enter' is pressed
          }
      });
  });
});

async function openPDF(route, method="GET", data = {}) {
  const form = document.createElement("form");
  form.method = method;
  form.action = route;
  form.target = "_blank";
  // Append data as hidden fields
  for (const key in data) {
      if (data.hasOwnProperty(key)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = data[key];
          form.appendChild(input);
      }
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}


function numberToWords(num) {
  if (num === 0) return "zero";

  const belowTwenty = [
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];
  const tens = [
      "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
  ];
  const scales = ["", "thousand", "million", "billion"];

  function toWords(num) {
      if (num === 0) return "";
      else if (num < 20) return belowTwenty[num];
      else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + belowTwenty[num % 10] : "");
      else if (num < 1000) {
          return (
              belowTwenty[Math.floor(num / 100)] +
              " hundred" +
              (num % 100 ? " and " + toWords(num % 100) : "")
          );
      }
      for (let i = 0, unit = 1; i < scales.length; i++, unit *= 1000) {
          if (num < unit * 1000) {
              return (
                  toWords(Math.floor(num / unit)) +
                  " " +
                  scales[i] +
                  (num % unit ? " " + toWords(num % unit) : "")
              );
          }
      }
  }

  // Handle decimal numbers
  const parts = num.toString().split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parts[1] : "";

  let words = toWords(integerPart);

  if (decimalPart) {
      const decimalWords = decimalPart
          .split("")
          .map(digit => belowTwenty[parseInt(digit, 10)])
          .join(" ");
      words += " point " + decimalWords;
  }

  return words.trim();
}

function formatNumberWithCommas(number) {
  try {
      // Ensure the input is a valid number
      if (isNaN(number)) {
          throw new Error("Invalid input: Input must be a valid number.");
      }

      // Convert the input to a number and then to a string
      return Number(number).toLocaleString();
  } catch (error) {
      console.error(error.message);
      return null; // Return null or a fallback value in case of an error
  }
}

function rtrim(str, splitter) {
  // 1. Input Validation
  if (typeof str !== 'string') {
    throw new Error('First parameter must be a string');
  }
  
  if (typeof splitter !== 'string' || splitter === '') {
    throw new Error('Second parameter must be a non-empty string');
  }

  // 2. Split and Process
  try {
    const real_arr = str.split(splitter);
    const emptyIndices = [];
    
    for (let i = 0; i < real_arr.length; i++) {
      if (real_arr[i] === '') {
        emptyIndices.push(i);
      }
    }
    
    // 3. Return Result
    return emptyIndices.length > 0 
      ? emptyIndices.join(splitter) 
      : 'No empty values found';
      
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
}

function money(number, decimals = 0, comma = 1) {
  try {
      // Ensure the input is a valid number
      if (isNaN(number)) {
          number=0;
      }

      // Convert the input to a number
      let formattedNumber = Number(number).toFixed(decimals);

      // If comma is set to 1, add comma as a thousands separator
      if (comma === 1) {
          formattedNumber = Number(formattedNumber).toLocaleString();
      }

      return formattedNumber;
  } catch (error) {
      console.error(error.message);
      return null; // Return null or a fallback value in case of an error
  }
}



function s(id, displayType) {
  // Get the element by its ID
  var element = document.getElementById(id);

  // If the second parameter is undefined, set display to 'block'
  if (displayType === undefined) {
    element.style.display = 'block';
  } else {
    // Otherwise, set the display to the value provided
    element.style.display = displayType;
  }
}

function h(id) {
  // Get the element by its ID
  var element = document.getElementById(id);
  element.style.display = 'none';
}

const socket = io({
  auth: {
    token: getCookie('userToken')  // Assuming 'joes' is the name of the cookie containing the token
  }
});

let lastActivityTime = Date.now();
const MAX_INACTIVITY_TIME = 2 * 60 * 1000; // 5 minutes of inactivity to go offline

// Function to get a specific cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop().split(';').shift();
    console.log('Cookie found:', cookieValue);
    return cookieValue;
  }
  
  console.log('Cookie not found');
  return null;
}


// Function to reset the inactivity timer
function resetInactivityTimer() {
  lastActivityTime = Date.now();
  socket.emit('user-active');  // Notify the server that the user is active
}

// Detect if the user switches tabs or minimizes the browser
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('User switched tabs or minimized the browser');
    socket.emit('user-inactive'); // Notify server that the user is inactive
  } else {
    console.log('User returned to the app');
    resetInactivityTimer(); // Reset inactivity timer
  }
});

// Listen for user activity like mouse, keyboard, or scroll
['keydown', 'click'].forEach(event => {
  document.addEventListener(event, resetInactivityTimer);
});

// Regularly ping the server to check if the user is still online
setInterval(() => {
  // If 5 minutes of inactivity passed, notify the server that the user is inactive
  if ((Date.now() - lastActivityTime) > MAX_INACTIVITY_TIME) {
    socket.emit('user-disconnect');  // Notify the server user is inactive
  }
  else {
    socket.emit('user-inactive');  // Keep the user as active by sending a heartbeat
  }
}, 1000 * 60 * 5);  // Send every 30 seconds


function showElementById(className, idToShow) {
  // Hide all elements with the specified class
  const elements = document.querySelectorAll(`.${className}`);
  elements.forEach(element => {
      element.style.display = "none"; // Hides each element
  });

  // Show the element with the specified ID
  const elementToShow = document.getElementById(idToShow);
  if (elementToShow) {
      elementToShow.style.display = "block"; // Shows the element with the provided ID
  }
}

function hideClass(className) {
  // Select all elements with the specified class using querySelectorAll
  document.querySelectorAll('.' + className).forEach(element => {
    element.style.display = 'none';
  });
}

function showClass(className, displayType) {
  // Select all elements with the specified class using querySelectorAll
  document.querySelectorAll('.' + className).forEach(element => {
    // If the second parameter is undefined, set display to 'block'
    if (displayType === undefined) {
      element.style.display = 'block';
    } else {
      // Otherwise, set the display to the value provided
      element.style.display = displayType;
    }
  });
}

function redirectPage(path) {
  // Assuming you want to send data like { name: "John", age: 30 }
  const data = { name: "John", age: 30 };
  
  const queryString = new URLSearchParams(data).toString();
  
  // Redirect with the query parameters appended to the URL
  window.location.href = path;
}

// Function to capture all form field values inside the form with id 'form-for-get-input' and store them in localStorage
function updateLocalStorage() {
  let data = {};

  // Select all form elements inside the form with id 'form-for-get-input'
  let formElements = document.querySelectorAll('#form-for-get-input *');

  // Loop through each form element
  formElements.forEach(element => {
    let id = element.id;

    // Only capture elements with an id (this avoids capturing elements without ids)
    if (id) {
        let value;

        // Handle different types of input elements
        if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
            // For input and textarea, get the value
            value = element.value;
        } else if (element.tagName.toLowerCase() === 'select') {
            // For select, get the selected option's value
            value = element.options[element.selectedIndex]?.value;
        } else if (element.tagName.toLowerCase() === 'file') {
            // For file inputs, get the file name(s)
            value = element.files.length > 0 ? Array.from(element.files).map(file => file.name).join(', ') : '';
        } else if (element.tagName.toLowerCase() === 'video') {
            // For video elements, we could capture the current video source or something else (optional)
            value = element.src || '';  // Just an example if you want to capture the video source
        } else if (element.tagName.toLowerCase() === 'checkbox') {
            // For checkboxes, get whether it is checked or not
            value = element.checked ? 'checked' : 'unchecked';
        }

        // Construct the key as elementName[barwing]elementValue
        let key = `${id}[barwing]${value}`;

        // Update the data object with the key and its value
        data[key] = value;
    }
});

// Save the updated object as a JSON string to localStorage
// localStorage.setItem('inputData', JSON.stringify(data));
}

// Add the event listener to capture keyup events for various input elements
document.querySelectorAll('#form-for-get-input input, #form-for-get-input textarea, #form-for-get-input select, #form-for-get-input file, #form-for-get-input video, #form-for-get-input checkbox').forEach(element => {
  element.addEventListener('keyup', updateLocalStorage);  // Handle keyup for text-like inputs
  element.addEventListener('click', updateLocalStorage);  // Handle click for checkbox, file, etc.

  // For select elements, also listen for the change event
  if (element.tagName.toLowerCase() === 'select') {
      element.addEventListener('change', updateLocalStorage);
  }
});

// Optional: To see the current data in localStorage, you can log it to the console
// window.addEventListener('load', () => {
//   let savedData = localStorage.getItem('inputData');
//   if (savedData) {
//       console.log('Saved data from localStorage:', JSON.parse(savedData));
//   }
// });

function locatePage(locate)
{
  const localPage = localStorage.getItem("pagesi");
  // Split the page data by [vix=2]
  const allPages = localPage.split("[vix=2]");
  
  // Get the current page's pathname
  const nowPage = window.location.pathname;
  
  // Iterate through the page IDs
  allPages.forEach((pageId, index) => {
    let [leftPage, rightPage] = pageId.split('<vrs>');
    
    // Check if the current page matches the rightPage
    if (rightPage == nowPage) {
      if (locate == "right") {
        // Navigate to the next page (right + 1 index)
        const nextIndex = index + 1 < allPages.length ? index + 1 : 0; // Loop back to the start if at the last page
        let [nextLeftPage, nextRightPage] = allPages[nextIndex].split('<vrs>');
        window.location.href = window.location.origin + nextRightPage; // Navigate to the next right page
      } else if (locate == "left") {
        // Navigate to the previous page (left - 1 index)
        const prevIndex = index - 1 >= 0 ? index - 1 : allPages.length - 1; // Loop back to the end if at the first page
        let [prevLeftPage, prevRightPage] = allPages[prevIndex].split('<vrs>');
        window.location.href = window.location.origin + prevRightPage; // Navigate to the previous right page
      }
    }
  });
}

// Remove the rowId from the allrowid hidden input
function removeId(id,split,remove) {
  const allRowIdsInput = document.getElementById(id);
  let allRowIds = allRowIdsInput.value ? allRowIdsInput.value.split(split) : [];
  allRowIds = allRowIds.filter(id => id !== remove);  // Remove the rowId
  allRowIdsInput.value = allRowIds.join(split);  // Update the hidden input
}

function generateUniqueId()
{
  const uniqueId = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return uniqueId; // Example: "id-1712345678901-742"
}

function addSno(classes) {
  // Get all elements with class 'serialno'
  const serialElements = document.querySelectorAll(classes);
  
  // Loop through each element and add serial number
  serialElements.forEach((element, index) => {
    element.innerHTML = index + 1; // Starts from 1 instead of 0
  });
}

function sumCls(classes) {
  let total = 0;
  // Get all elements with class 'extras'
  const extraElements = document.querySelectorAll('.'+classes);
  // Sum their values
  extraElements.forEach(element => {
    // Get the numeric value (handles text, numbers, or input values)
    const value = valNum(element.value);
    total += valNum(value);
  });
  
  return total;
}

function FutureDate(startDate, daysToAdd) {
  // Convert the input date to a JavaScript Date object
  const date = new Date(startDate);

  // Check if the date is invalid
  if (isNaN(date.getTime())) {
    // If invalid, use today's date
    console.warn("Invalid start date provided, using today's date.");
    date.setTime(new Date().getTime());
  }

  // Add the specified number of days
  date.setDate(date.getDate() + daysToAdd);

  // Return the calculated future date in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

document.addEventListener('change', (event) => {
  if(event.target.classList.contains("metal-select-class"))
    {
      const id = event.target.id.split("_")[1];
      load_metal_based_price(id,event.target.id)
    }
});

// for exchange
document.addEventListener('keydown', (event) => {
  if(event.key === 'Enter')
  {
    if(event.target.classList.contains("edit-icon-ex"))
    {
      const ids = Val(event.target.id,"uniquekey");
      Sv("bankamount_"+ids, Val("all_bank_amount"+ids));
      $(".old-exs").hide();
      s("olddetails");
      s("oldex"+ids)
      addSno(".exchange-sno")
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
    }
    if(event.target.classList.contains("delete-icon-ex"))
    {
      const uniquekey = Val(event.target.id,"uniquekey");
      document.getElementById("ex-tr"+uniquekey).remove();
      document.getElementById("old"+uniquekey).remove();
      removeId("oldpart","[s~1]",uniquekey);
      addSno(".exchange-sno")
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
    }
  }
});

// for exchange
document.addEventListener('click', (event) => {
  const clickedId = event.target.id;
  if(clickedId=="old-btn")
  {
    const parentDiv = document.getElementById('olddetails');
    const table_tr = document.getElementById('excahnge-tbody');
    if (parentDiv && parentDiv.children.length > 0 && parentDiv.style.display != "none") {
        h("olddetails","none")
        const lastDiv = parentDiv.lastElementChild;
        const lastDivId = lastDiv.id.split("old")[1];
        if (lastDiv && lastDiv.tagName === 'DIV') {
            parentDiv.removeChild(lastDiv);
            const edited_tr = document.getElementById("ex-tr"+lastDivId);
            if(edited_tr)
              document.getElementById("ex-tr"+lastDivId).remove();
        }
        removeId("oldpart","[s~1]",lastDivId)
        return;
    }
    else
      s("olddetails","flex")
    let html = '';
    const stones = generateUniqueId();
    html += `<div id='oldex${stones}' class="old-exs"><div class='show-with' style='display:flex;gap:10px;'>`+selectBoxes({id:"exchange_"+stones, options:"nd:Exchange Modes", classes:'stone-select-class'})+`<div class='show-old' id='show-old${stones}' display='display:none;'></div></div><div id='part${stones}'></div></div>`;// <img src='/images/delete.png' class='delete-ex-bank-button' id='ston${stones}' lot='${stones}'>
    Sa("olddetails",'old'+stones,html);
    selectLoad("exchange_"+stones, '/auth/modes', content = 'application/json', undefined);
    Sv("oldpart",Val("oldpart")+stones+"[s~1]");
  }
  if(event.target.classList.contains("metal-select-class"))
  {
    const id = event.target.id.split("_")[1];
    load_metal_based_price(id,event.target.id)
  }
  if(event.target.classList.contains("delete-ex-bank-button"))
  {
      const lot = Val(clickedId,"lot")
      const id = "old"+lot;
      document.getElementById(id).remove();
      removeId("oldpart","[s~1]",lot)
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
      addSno(".exchange-sno")
  }
  if(event.target.classList.contains("is-select"))
  {
      let html='';
      const id = event.target.classList[1].split("exchange_")[1];
      if(id)
      {
          html += `<div class='ex-entry-div' id='ex-entry-div${id}'>`;
          const addonvalue = Val("exchange_"+id);
          if(addonvalue=="old")
          {
              html += selectBoxes({id:"oldmetal_"+id, options:"gold:Gold,silver:Silver", classes:'metal-select-class old'});
              html += createInputElement({id: "oldweight_"+id, type: "number", placeholder: "Weight", className:"oldcalculation extras_old_weight", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldwaste_"+id, type: "number", placeholder: "Wastage", className:"oldcalculation extras_old_waste", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldpcs_"+id, type: "number", placeholder: "Pcs", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldprice_"+id, type: "number", placeholder: "Old Price", value: Val("gold22k"), className:"oldcalculation", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldtotalprice_"+id, type: "number", placeholder: "Old Total Price", className:"oldcalculation", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldstonecount_"+id, type: "number", placeholder: "Stone Count", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldstoneweight_"+id, type: "number", placeholder: "Stone weight", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldcaratsize_"+id, type: "number", placeholder: "Carat Size", className: "carat-exchange", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldcaratprice_"+id, type: "number", placeholder: "Carat Price", className: "carat-exchange", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "oldcarattotalprice_"+id, type: "number", placeholder: "Carat Total Price", className: "carat-exchange", othersForDiv:"old-sml-box"});
              html += imageLoader({id:"proof_"+id, placeholder:"Proof"});
              html += `<label>Old Price : <font id='totaloldpricehtml${id}'>0</font></label>`;
              html += `<input type='hidden' id='totaloldprice${id}' name='totaloldprice${id}' class='extras old_totalprice' value='0'></div>
              <div id='ex-entry-div${id}' class='ex-show-div'></div>`;
          }
          if(addonvalue=="coin")
          {
              html += selectBoxes({id:"coinmetal_"+id, options:"gold:Gold,silver:Silver", classes:'metal-select-class coin', othersForDiv:"old-sml-box"});
              html += createInputElement({id: "coinpcs_"+id, type: "number", placeholder: "Coin Pcs", othersForDiv:"old-sml-box", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "coinweight_"+id, type: "number", placeholder: "Coin Weight", className:"coincalculation extras_coin_weight", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "coinprice_"+id, type: "number", placeholder: "Coin Price", value: Val("gold22k"), className:"coincalculation", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "cointotalprice_"+id, type: "number", placeholder: "Coin Total Price", className:"coincalculation", othersForDiv:"old-sml-box"});
              html += imageLoader({id:"proof_"+id, placeholder:"Proof"});
              html += `<label>Coin Price : <font id='totalcoinpricehtml${id}'>0</font></label>`;
              html += `<input type='hidden' id='totalcoinprice${id}' name='totalcoinprice${id}' class='extras coin_totalprice' value='0'></div>`;
          }
          if(addonvalue=="exchange")
          {
              html += createInputElement({id: "excode_"+id, type: "text", placeholder: "Ex Code", className: "extras_ex_weight", othersForDiv:"old-sml-box"});
              html += `<label>exchange Price : <font id='totalexpricehtml${id}'>0</font></label>`;
              html += `<input type='hidden' id='exchangeprice${id}' name='exchangeprice${id}' class='extras ex_totalprice' value='0'></div>`;
          }
          if(addonvalue=="pure")
          {
              html += selectBoxes({id:"puremetal_"+id, options:"gold:Gold,silver:Silver", classes:'metal-select-class pure'});
              html += createInputElement({id: "purepcs_"+id, type: "number", placeholder: "Pcs", className:"purecalculation", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "pureweight_"+id, type: "number", placeholder: "Pure Weight", className:"purecalculation extras_pure_weight", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "pureprice_"+id, type: "number", placeholder: "Pure Price", value: Val("gold24k"), className:"purecalculation", othersForDiv:"old-sml-box"});
              html += createInputElement({id: "puretotalprice_"+id, type: "number", placeholder: "Pure Total Price", className:"purecalculation", othersForDiv:"old-sml-box"});
              html += imageLoader({id:"proof_"+id, placeholder:"Proof"});
              html += `<label>Pure Price : <font id='totalpurepricehtml${id}'>0</font></label>`;
              html += `<input type='hidden' id='totalpureprice${id}' name='totalpureprice${id}' class='extras pure_totalprice' value='0'></div>`;
          }
          html += `<div style="display:flex;justify-content:space-between;"><button type='button' id='add-exchange${id}' class='add-exchange' ids='${id}'>OK</button><button type='button' id='cencel-exchange${id}' class='cancel-exchange' ids='${id}' style="background:red;color:white;">Cancel</button></div>`;
          html += `</div>`;
          Sii('part'+id,html);
      }
    }
    if(event.target.classList.contains("cancel-exchange"))
    {
      const uniquekey = Val(event.target.id,"ids");
      document.getElementById("old"+uniquekey).remove();
      removeId("oldpart","[s~1]",uniquekey);
      h("olddetails");
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
      addSno(".exchange-sno")
    }
    if(event.target.classList.contains("edit-icon-ex"))
    {
      const ids = Val(event.target.id,"uniquekey");
      Sv("bankamount_"+ids, Val("all_bank_amount"+ids));
      $(".old-exs").hide();
      s("olddetails");
      s("oldex"+Val(event.target.id,"uniquekey"))
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
      addSno(".exchange-sno")
    }
    if(event.target.classList.contains("delete-icon-ex"))
    {
      const uniquekey = Val(event.target.id,"uniquekey");
      document.getElementById("ex-tr"+uniquekey).remove();
      document.getElementById("old"+uniquekey).remove();
      removeId("oldpart","[s~1]",uniquekey);
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
      addSno(".exchange-sno")
    }
    if(event.target.classList.contains("add-exchange"))
    {
      const role = document.getElementById(event.target.id).getAttribute('ids');
      let thtml = "";
      const type_of_ex = Val("exchange_"+role)
      let metal = "";
      let weight = 0;
      let waste = 0;
      let pcs = 0;
      let code = "";
      let price = 0;
      let total_price = 0;
      let stone_count = 0;
      let stone_weight = 0;
      let carat_size = 0;
      let carat_rate = 0;
      let carat_total_price = 0;
      let proof = "";
      if (type_of_ex == "old")
      {
        metal = Val("oldmetal_"+role);
        weight = Val("oldweight_"+role);
        waste = Val("oldwaste_"+role);
        pcs = Val("oldpcs_"+role);
        price = Val("oldprice_"+role);
        total_price = Val("totaloldprice"+role);
        stone_count = Val("oldstonecount_"+role);
        stone_weight = Val("oldstoneweight_"+role);
        carat_size = Val("oldcaratsize_"+role);
        carat_rate = Val("oldcaratprice_"+role);
        carat_total_price = Val("oldcarattotalprice_"+role);
      }
      else if (type_of_ex == "pure")
      {
        metal = Val("puremetal_"+role);
        weight = Val("pureweight_"+role);
        pcs = Val("purepcs_"+role);
        price = Val("pureprice_"+role);
        total_price = Val("puretotalprice_"+role);
      }
      else if (type_of_ex == "coin")
      {
        metal = Val("coinmetal_"+role);
        weight = Val("coinweight_"+role);
        pcs = Val("coinpcs_"+role);
        price = Val("coinprice_"+role);
        total_price = Val("cointotalprice_"+role);
      }
      else if (type_of_ex == "exchange")
      {
        metal = Val("exmetal_"+role);
        weight = Val("exweight_"+role);
        waste = Val("exwaste_"+role);
        pcs = Val("expcs_"+role);
        code = Val("excode_"+role);
        price = Val("exprice_"+role);
        total_price = Val("extotalprice_"+role);
      }
      proof = Val("imgpath_proof_"+role);
      const rowCount = document.querySelectorAll('#excahnge-tbody tr').length;
      thtml += `<td class='exchange-sno'>${rowCount+1}</td>`;
      thtml += `<td>${caps(metal)}</td>`;
      thtml += `<td>${code}</td>`;
      thtml += `<td>${ generateImageTag(proof, 'profile', 'default_proof_css', '')} ${caps(type_of_ex)}</td>`;
      thtml += `<td class='right-align'>(T) ${money(weight, 3, 1)+".G - (W) "+money(waste, 3, 1)+".G = (A) "+money(parseFloat(weight - waste), 3, 1)+".G"}</td>`;
      thtml += `<td class='right-align'>${money(total_price, 3, 1)}</td>`;
      thtml += `<td>
                  <div class='flex-with-space-edit-delete'><img src="/images/edit.png" width="25" height="25" class="edit-icon-ex click-action sheetclick" tabindex="0" title="" id="edit-ex${role}" uniquekey="${role}"/>
                  <img src="/images/delete.png" class="delete-icon-ex click-action sheetclick" tabindex="0" title="" width="25" height="25" id="delete-ex${role}" uniquekey="${role}"/>
                  </div>
                </td>`;
      const edited_tr = document.getElementById("ex-tr"+role);
      if(edited_tr)
        document.getElementById("ex-tr"+role).remove();
      Sat("excahnge-tbody", "ex-tr"+role, thtml);
      h("oldex"+role);
      h("olddetails");
      Si("total-exchange-amount",money(sumCls("extras"), 3, 1))
      addSno(".exchange-sno")
    }
});

// for banking
document.addEventListener('keydown', (event) => {
  if(event.target.classList.contains("bankcalculation"))
  {
    const bank_amt = Val(event.target.id);
    const ids = event.target.id.split("bankamount_")[1];
    Sv("all_bank_amount"+ids, bank_amt)
  }
  if(event.key === 'Enter')
  {
    if(event.target.classList.contains("edit-icon-bank"))
    {
      $(".banking").hide();
      s("banking-sheet","flex");
      s("banking"+Val(event.target.id,"uniquekey"),"flex")
      addSno(".bank-sno")
      Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
    }
    if(event.target.classList.contains("delete-icon-bank"))
    {
      const uniquekey = Val(event.target.id,"uniquekey");
      document.getElementById("bank-tr"+uniquekey).remove();
      document.getElementById("banking"+uniquekey).remove();
      removeId("bankpart","[s~1]",uniquekey);
      addSno(".bank-sno")
      Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
    }
  }
});

// for banking
document.addEventListener('click', (event) => {
  let html = ''; 
  const clickedId = event.target.id;
  if(clickedId=="bank-btn")
  {
    const parentDiv = document.getElementById('banking-sheet');
    const table_tr = document.getElementById('banking-tbody');
    if (parentDiv && parentDiv.children.length > 0 && parentDiv.style.display != "none") {
        h("banking-sheet","none")
        const lastDiv = parentDiv.lastElementChild;
        const lastDivId = lastDiv.id.split("banking")[1];
        if (lastDiv && lastDiv.tagName === 'DIV') {
            parentDiv.removeChild(lastDiv);
            const edited_tr = document.getElementById("bank-tr"+lastDivId);
            if(edited_tr)
              document.getElementById("bank-tr"+lastDivId).remove();
        }
        removeId("bankpart","[s~1]",lastDivId)
        return;
    }
    else
      s("banking-sheet","flex")
    const id = generateUniqueId();
    html = `<div class="banking" id="banking${id}">`+
                selectBoxes({id:"bank_"+id, options:"nd:Bank"})+
                selectBoxes({id:"transactiontype_"+id, options:"nd:Transaction Type"})+
                createInputElement({id: "bankamount_"+id, type: "number", placeholder: "Amount", className:"bankcalculation"})+
            `<div class="banking-btns"><button type='button' id='add-banking${id}' class='add-banking' ids='${id}'>OK</button>
            <button type='button' id='cencel-banking${id}' class='cancel-banking' ids='${id}' style="background:red;color:white;">Cancel</button></div>
            <input type='hidden' id='all_bank_amount${id}' name='all_bank_amount${id}' class='bankcalculations' value='0'>
            </div>`;
    Sii("banking-sheet", html);
    Sv("bankpart",Val("bankpart")+id+"[s~1]");
    selectLoad('bank_'+id, '/auth/bank', content = 'application/json', undefined);
    selectLoad('transactiontype_'+id, '/auth/transactionType', content = 'application/json', undefined);
  }
  if(event.target.classList.contains("edit-icon-bank"))
  {
    $(".banking").hide();
    s("banking-sheet","flex");
    s("banking"+Val(event.target.id,"uniquekey"),"flex")
    addSno(".bank-sno")
    Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
  }
  if(event.target.classList.contains("delete-icon-bank"))
  {
    const uniquekey = Val(event.target.id,"uniquekey");
    document.getElementById("bank-tr"+uniquekey).remove();
    document.getElementById("banking"+uniquekey).remove();
    removeId("bankpart","[s~1]",uniquekey);
    addSno(".bank-sno")
    Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
  }
  if(event.target.classList.contains("add-banking"))
  {
    const role = document.getElementById(event.target.id).getAttribute('ids');
      let thtml = "";
      let bank = Val("bank_"+role);
      let type = Val("transactiontype_"+role);
      let Amount = Val("bankamount_"+role);
      const rowCount = document.querySelectorAll('#banking-tbody tr').length;
      thtml += `<td class='bank-sno'>${rowCount+1}</td>`;
      thtml += `<td>${caps(bank)} - ${caps(type)}</td>`;
      thtml += `<td class='right-align'>${money(Amount,3,1)}</td>`;
      thtml += `<td>
                  <div class='flex-with-space-edit-delete'><img src="/images/edit.png" width="25" height="25" class="edit-icon-bank click-action sheetclick" tabindex="0" title="" id="edit-bank${role}" uniquekey="${role}"/>
                  <img src="/images/delete.png" class="delete-icon-bank click-action sheetclick" tabindex="0" title="" width="25" height="25" id="delete-bank${role}" uniquekey="${role}"/>
                  </div>
                </td>`;
      const edited_tr = document.getElementById("bank-tr"+role);
      if(edited_tr)
        document.getElementById("bank-tr"+role).remove();
      Sat("banking-tbody", "bank-tr"+role, thtml);
      h("banking"+role);
      h("banking-sheet");
      addSno(".bank-sno")
      Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
  }
  if(event.target.classList.contains("cancel-banking"))
  {
    const uniquekey = Val(event.target.id,"ids");
    document.getElementById("banking"+uniquekey).remove();
    removeId("bankpart","[s~1]",uniquekey);
    h("banking-sheet");
    addSno(".bank-sno")
    Si("total-banking-amount",money(sumCls("bankcalculations"), 3, 1))
  }
});

function oldSet(data)
{
  const exchange = data.exchange_types.split("[0~0]");
  for(let i=0;i<exchange.length;i++)
  {
    let html = '';
    const stones = generateUniqueId();
    html += `<div id='oldex${stones}'><div class='show-with' style='display:flex;gap:10px;'>`+selectBoxes({id:"exchange_"+stones, options:"nd:Exchange Modes,old:Old,coin:Coin,exchange:Exchange,pure:Pure", classes:'stone-select-class'})+`<div class='show-old' id='show-old${stones}' display='display:none;'></div></div><div id='part${stones}'></div></div>`; // <img src='/images/delete.png' class='delete-ex-bank-button' id='ston${stones}' lot='${stones}'>
    Sa("olddetails",'old'+stones,html);
    selectLoad("exchange_"+stones, '/'+fullURL.split('/')[fullURL.split('/').length-1]+'/modes', content = 'application/json', undefined);
    Sv("oldpart",Val("oldpart")+stones+"[s~1]");
    Sv("exchange_"+stones,exchange[i]);
    const id = stones;
    html = '';
    if(exchange[i]=="old")
    {
      const metal = data.old_metal.split("[0~0]")[i];
      html += `<div class='ex-entry-div' id='ex-entry-div${id}'>`;
      if(metal=="gold")
      html += selectBoxes({id:"oldmetal_"+id, options:"gold:Gold,silver:Silver", classes:'metal-select-class old'});
      else
      html += selectBoxes({id:"oldmetal_"+id, options:"silver:Silver,gold:Gold", classes:'metal-select-class old'});
      html += createInputElement({id: "oldweight_"+id, type: "number", placeholder: "Weight", className:"oldcalculation extras_old_weight", othersForDiv:"old-sml-box", value:data.old_weight.split("[0~0]")[i]});
      html += createInputElement({id: "oldwaste_"+id, type: "number", placeholder: "Wastage", className:"oldcalculation extras_old_waste", othersForDiv:"old-sml-box", value:data.old_waste.split("[0~0]")[i]});
      html += createInputElement({id: "oldpcs_"+id, type: "number", placeholder: "Pcs", othersForDiv:"old-sml-box", value:data.old_pcs.split("[0~0]")[i]});
      html += createInputElement({id: "oldprice_"+id, type: "number", placeholder: "Old Price", value: Val("gold22k"), className:"oldcalculation", othersForDiv:"old-sml-box", value:data.old_price.split("[0~0]")[i]});
      html += createInputElement({id: "oldtotalprice_"+id, type: "number", placeholder: "Old Total Price", className:"oldcalculation", othersForDiv:"old-sml-box", value:data.old_totalprice.split("[0~0]")[i]});
      html += createInputElement({id: "oldstonecount_"+id, type: "number", placeholder: "Stone Count", othersForDiv:"old-sml-box"});
      html += createInputElement({id: "oldstoneweight_"+id, type: "number", placeholder: "Stone weight", othersForDiv:"old-sml-box"});
      html += createInputElement({id: "oldcaratsize_"+id, type: "number", placeholder: "Carat Size", className: "carat-exchange", othersForDiv:"old-sml-box", value:data.old_caratsize.split("[0~0]")[i]});
      html += createInputElement({id: "oldcaratprice_"+id, type: "number", placeholder: "Carat Price", className: "carat-exchange", othersForDiv:"old-sml-box", value:data.old_caratrate.split("[0~0]")[i]});
      html += createInputElement({id: "oldcarattotalprice_"+id, type: "number", placeholder: "Carat Total Price", className: "carat-exchange", othersForDiv:"old-sml-box", value:data.old_carat_totalprice.split("[0~0]")[i]});
      html += imageLoader({id:"proof_"+id, placeholder:"Proof"});
      html += `<label>Old Price : <font id='totaloldpricehtml${id}'>${data.totaloldprice.split("[0~0]")[i]}</font></label>`;
      html += `<input type='hidden' id='totaloldprice${id}' name='totaloldprice${id}' class='extras old_totalprice' value='${data.totaloldprice.split("[0~0]")[i]}'></div>
      <div id='ex-entry-div${id}' class='ex-show-div'></div>`;
    }
    Si('part'+id,html);
  }
  setTimeout(()=>{
    for(let i=0;i<exchange.length;i++)
    {
      const id = Val("oldpart").split("[s~1]")[i];
      Ss("exchange_"+id, exchange[i], 0);
    }
  },1000);
}

function getValInClass(className, separator = ', ') {
  debugger
  // Get all elements with the specified class
  const elements = document.querySelectorAll(`.${className}`);
  
  // Extract text content from each element and trim whitespace
  const values = Array.from(elements).map(el => el.value.trim());
  
  // Join values with the specified separator
  return values.join(separator);
}

function load_metal_based_price(id,val)
{
  const value = Val(val);
  // Select all elements with class containing 'metal-select-class'
const elements = document.querySelectorAll('[class*="metal-select-class"]');

// Loop through all selected elements
let nearClass='';
elements.forEach(element => {
    
    // Find the class name that contains 'metal-select-class'
    const metalClass = element.classList[1];
        // Check if the next sibling exists
    if (metalClass=="pure" && value=="gold")
      Sv("pureprice_"+id, Val("gold24k"));
    else if (metalClass=="pure" && value=="silver")
      Sv("pureprice_"+id, Val("gensilver"));
    else if (metalClass=="coin" && value=="gold")
      Sv("coinprice_"+id, Val("gold22k"));
    else if (metalClass=="coin" && value=="silver")
      Sv("coinprice_"+id, Val("gensilver"));
    else if (metalClass=="old" && value=="gold")
      Sv("oldprice_"+id, Val("gold22k"));
    else if (metalClass=="old" && value=="silver")
      Sv("oldprice_"+id, Val("gensilver"));
    nearClass = metalClass;
  });
  window[nearClass+"_calculation"](val);
}

document.addEventListener("keyup", (event) => {
  const classes = event.target.classList[0];
  const id = event.target.id;
  if(classes=="purecalculation")
  {
      pure_calculation(id);
  }
  if(classes=="oldcalculation")
  {
      old_calculation(id);
  }
  if(classes=="coincalculation")
  {
      coin_calculation(id);
  }
  if(classes=="carat-exchange")
  {
      carat_calculation(id);
  }
  if(classes=="calculation")
  {
      var event = new KeyboardEvent('click', {
        bubbles: true,
        cancelable: true,
        key: 'Enter' // or any other key you'd like to simulate
    });
    document.getElementById("exchangeFunction").dispatchEvent(event);
  }
});

function pure_calculation(id)
{
    const ids = id.split("_")[1];
    const idkal = id.split("_")[0];
    const pureweight = valNum(Val("pureweight_"+ids));
    const pureprice = valNum(Val("pureprice_"+ids));
    const puretotalprice = valNum(Val("puretotalprice_"+ids));
    if(idkal=="puretotalprice")
    {
        const weight = valNum(parseFloat(puretotalprice)) / valNum(parseFloat(pureprice));
        Sv("pureweight_"+ids,money(weight,3,0));
    }
    else
    {
        const total = valNum(parseFloat(pureweight)) * valNum(parseFloat(pureprice));
        Sv("puretotalprice_"+ids,money(total,3,0));
    }
    Sv("totalpureprice"+ids,money(Val("puretotalprice_"+ids),3,0));
    Si("totalpurepricehtml"+ids,money(Val("puretotalprice_"+ids),3,1));
    var event = new KeyboardEvent('click', {
        bubbles: true,
        cancelable: true,
        key: 'Enter' // or any other key you'd like to simulate
    });
    document.getElementById("exchangeFunction").dispatchEvent(event);
}
function old_calculation(id)
{
    const ids = id.split("_")[1];
    const idkal = id.split("_")[0];
    const oldweight = valNum(Val("oldweight_"+ids));
    const oldwaste = valNum(Val("oldwaste_"+ids));
    const oldprice = valNum(Val("oldprice_"+ids));
    const oldtotalprice = valNum(Val("oldtotalprice_"+ids));
    const oldcarattotalprice = valNum(Val("oldcarattotalprice_"+ids));
    if(idkal=="oldtotalprice")
    {
        const weight = valNum(parseFloat(oldtotalprice)) / valNum(parseFloat(oldprice));
        const waste = valNum(parseFloat(oldweight)) - valNum(parseFloat(weight));
        Sv("oldwaste_"+ids,money(waste,3,0));
    }
    else
    {
        const total = valNum(parseFloat(parseFloat(oldweight) - parseFloat(oldwaste))) * valNum(parseFloat(oldprice));
        Sv("oldtotalprice_"+ids,money(total,3,0));
    }
    const total_old = money(parseFloat(Val("oldtotalprice_"+ids)) + parseFloat(oldcarattotalprice),3,0);
    Sv("totaloldprice"+ids,total_old);
    Si("totaloldpricehtml"+ids,money(total_old,3,1));
    var event = new KeyboardEvent('click', {
        bubbles: true,
        cancelable: true,
        key: 'Enter' // or any other key you'd like to simulate
    });
    document.getElementById("exchangeFunction").dispatchEvent(event);
}
function coin_calculation(id)
{
    const ids = id.split("_")[1];
    const idkal = id.split("_")[0];
    const coinweight = valNum(Val("coinweight_"+ids));
    const coinprice = valNum(Val("coinprice_"+ids));
    const cointotalprice = valNum(Val("cointotalprice_"+ids));
    if(idkal=="cointotalprice")
    {
        const weight = valNum(parseFloat(cointotalprice)) / valNum(parseFloat(coinprice));
        Sv("coinweight_"+ids,money(weight,3,0));
    }
    else
    {
        const total = valNum(parseFloat(coinweight)) * valNum(parseFloat(coinprice));
        Sv("cointotalprice_"+ids,money(total,3,0));
    }
    Sv("totalcoinprice"+ids,money(Val("cointotalprice_"+ids),3,0));
    Si("totalcoinpricehtml"+ids,money(Val("cointotalprice_"+ids),3,1));
    var event = new KeyboardEvent('click', {
        bubbles: true,
        cancelable: true,
        key: 'Enter' // or any other key you'd like to simulate
    });
    document.getElementById("exchangeFunction").dispatchEvent(event);
}
function carat_calculation(id)
{
    const ids = id.split("_")[1];
    const idkal = id.split("_")[0];
    const oldcaratsize = valNum(Val("oldcaratsize_"+ids));
    const oldcaratprice = valNum(Val("oldcaratprice_"+ids));
    const oldcarattotalprice = valNum(Val("oldcarattotalprice_"+ids));
    if(idkal=="oldcarattotalprice")
    {
        const total = valNum(parseFloat(oldcarattotalprice)) / valNum(parseFloat(oldcaratprice));
        Sv("oldcaratsize_"+ids,money(total,3,0));
    }
    else
    {
        const price = valNum(parseFloat(oldcaratsize)) * valNum(parseFloat(oldcaratprice));
        Sv("oldcarattotalprice_"+ids,money(price,3,0));
    }
    const total_old = money(parseFloat(Val("oldtotalprice_"+ids)) +parseFloat(oldcarattotalprice),3,0);
    Sv("totaloldprice"+ids,total_old);
    Si("totaloldpricehtml"+ids,money(total_old,3,1));
    var event = new KeyboardEvent('click', {
        bubbles: true,
        cancelable: true,
        key: 'Enter' // or any other key you'd like to simulate
    });
    document.getElementById("exchangeFunction").dispatchEvent(event);
}


function roundOff10(number) {
  // Get the last digit of the number
  const lastDigit = number % 10;

  // If the last digit is 5 or greater, round up to the next multiple of 10
  if (lastDigit >= 5) {
    return number + (10 - lastDigit);
  } else {
    // Otherwise, round down to the previous multiple of 10
    return number - lastDigit;
  }
}

document.addEventListener("keydown", (event) => {
  if(event.key==="Enter")
  {
    if(event.target.id==="left-in" || event.target.id==="left-indi")
    {
      locatePage("left")
    }
    if(event.target.id==="right-in" || event.target.id==="right-indi")
    {
      locatePage("right")
    }
  }
});

document.addEventListener("click", (event) => {
  if(event.target.id==="left-in" || event.target.id==="left-indi")
  {
    locatePage("left")
  }
  if(event.target.id==="right-in" || event.target.id==="left-indi")
  {
    locatePage("right")
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("dragover", (event) => {
    const clickedIs = event.target.id;
    const element = document.getElementById(clickedIs);
    let uploaderId = null; // Default value if data-id doesn't exist

    if (element && element.hasAttribute("data-id")) {
      uploaderId = element.getAttribute("data-id");
    } else {
      console.log("data-id not found or element not found");
    }
    if(uploaderId)
    {
      const clickedClass = event.target.classList;
      let dropZone = document.getElementById('drop-zone-for-image_'+uploaderId);
      if(dropZone)
      {
        event.preventDefault();
        dropZone.classList.add('over');
      }
    }
  });
  document.addEventListener("dragleave", (event) => {
    const clickedIs = event.target.id;
    const element = document.getElementById(clickedIs);
    let uploaderId = null; // Default value if data-id doesn't exist

    if (element && element.hasAttribute("data-id")) {
      uploaderId = element.getAttribute("data-id");
    } else {
      console.log("data-id not found or element not found");
    }
    if(uploaderId)
    {
      const clickedClass = event.target.classList;
      let dropZone = document.getElementById('drop-zone-for-image_'+uploaderId);
      if(dropZone)
        dropZone.classList.remove('over');
    }
  });
  document.addEventListener("drop", (e) => {
    const clickedIs = e.target.id;
    const element = document.getElementById(clickedIs);
    let uploaderId = null; // Default value if data-id doesn't exist

    if (element && element.hasAttribute("data-id")) {
      uploaderId = element.getAttribute("data-id");
    } else {
      console.log("data-id not found or element not found");
    }
    if(uploaderId)
    {
      const clickedClass = e.target.classList;
      let imageElement = document.getElementById('image_'+uploaderId);
      let imageContainer = document.getElementById('image-container_'+uploaderId);
      let dropZone = document.getElementById('drop-zone-for-image_'+uploaderId);
      e.preventDefault();
        dropZone.classList.remove('over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(event) {
            imageElement.src = event.target.result;
            imageContainer.style.display = 'block';
            initializeCropper(imageElement);
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please drop a valid image file.');
        }
        function initializeCropper(image) 
        {
          currentShape = window[uploaderId+"_cropshape"];
          let cropper = window[uploaderId+"_cropper"];
          if (cropper) {
            cropper.destroy();
          }
          cropper = new Cropper(image, {
            aspectRatio: currentShape === 'square' ? 1 : NaN,
            viewMode: 2,
            responsive: true,
            guides: true,
            cropBoxResizable: true,
            dragMode: 'move',
            minCropBoxWidth: 100,
            minCropBoxHeight: 100,
            ready() {
              if (currentShape === 'circle' || currentShape === 'ellipse') {
                image.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
                cropper.cropBox.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
                cropper.cropBox.style.overflow = 'hidden';
              }
            },
          });
        dropZone.style.display = "none";
        createGlobalVariable(uploaderId+"_cropper",cropper);
      }
    }
  });
  document.addEventListener("change", (event) => {
    const clickedIs = event.target.id;
    const element = document.getElementById(clickedIs);
    let uploaderId = null; // Default value if data-id doesn't exist

    if (element && element.hasAttribute("data-id")) {
      uploaderId = element.getAttribute("data-id");
    } else {
      console.log("data-id not found or element not found");
    }
    if(uploaderId)
    {
      const clickedClass = event.target.classList;
      let cropper;
      let imageElement = document.getElementById('image_'+uploaderId);
      let canvasElement = document.getElementById('canvas_'+uploaderId);
      let imageContainer = document.getElementById('image-container_'+uploaderId);
      let videoContainer = document.getElementById('video-container_'+uploaderId);
      let dropZone = document.getElementById('drop-zone-for-image_'+uploaderId);
      let videoElement = document.getElementById('video_'+uploaderId);
      let captureFrame = document.getElementById('capture-frame_'+uploaderId);
      let currentShape = 'square';
      let file_input = document.getElementById('file-input-for-image_'+uploaderId);
      let stream;
      
      if(clickedClass=="file-input-for-image")
      {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          imageElement.src = e.target.result;
          imageContainer.style.display = 'block';
          initializeCropper(imageElement);
        };
        reader.readAsDataURL(file);
      }
      function initializeCropper(image) {
          currentShape = window[uploaderId+"_cropshape"];
          let cropper = window[uploaderId+"_cropper"];
        if (cropper) {
          cropper.destroy();
        }
        cropper = new Cropper(image, {
          aspectRatio: currentShape === 'square' ? 1 : NaN,
          viewMode: 2,
          responsive: true,
          guides: true,
          cropBoxResizable: true,
          dragMode: 'move',
          minCropBoxWidth: 100,
          minCropBoxHeight: 100,
          ready() {
            if (currentShape === 'circle' || currentShape === 'ellipse') {
              image.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
              cropper.cropBox.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
              cropper.cropBox.style.overflow = 'hidden';
            }
          },
        });
        dropZone.style.display = "none";
        createGlobalVariable(uploaderId+"_cropper",cropper);
      }
    }
  });
  document.addEventListener('keydown', function(event) {
      if(event.target.classList.contains("image-upload-upload-img") && event.key === 'Enter')
      {
        // Reset file input value
        const file_input = document.getElementById(event.target.id);
        file_input.click();
      }
  });
  document.addEventListener("click", (event) => {
    const clickedIs = event.target.id;
    const element = document.getElementById(clickedIs);
    let uploaderId = null; // Default value if data-id doesn't exist

    if (element && element.hasAttribute("data-id")) {
      uploaderId = element.getAttribute("data-id");
    } else {
      console.log("data-id not found or element not found");
    }
    if(uploaderId)
    {
      const clickedClass = event.target.classList;
      let cropper;
      let imageElement = document.getElementById('image_'+uploaderId);
      let canvasElement = document.getElementById('canvas_'+uploaderId);
      let imageContainer = document.getElementById('image-container_'+uploaderId);
      let videoContainer = document.getElementById('video-container_'+uploaderId);
      let dropZone = document.getElementById('drop-zone-for-image_'+uploaderId);
      let videoElement = document.getElementById('video_'+uploaderId);
      let captureFrame = document.getElementById('capture-frame_'+uploaderId);
      let currentShape = 'square';
      let file_input = document.getElementById('file-input-for-image_'+uploaderId);
      let stream;
      
      if(clickedClass=="image-upload-upload-img" || clickedClass=="drop-zone-for-image")
      {
        // Reset file input value
        const file_input = document.getElementById("file-input-for-image_"+uploaderId);
        file_input.value = '';
        file_input.click();
      }
      if(clickedClass=="image-upload-crop")
      {
        if (window[uploaderId+"_cropper"]) {
          const croppedCanvas = window[uploaderId+"_cropper"].getCroppedCanvas({
            width: window[uploaderId+"_cropper"].getImageData().naturalWidth, // Use the natural (original) width
            height: window[uploaderId+"_cropper"].getImageData().naturalHeight, // Use the natural (original) height
          });
          let finalCanvas = croppedCanvas;

          // If the selected shape is circle or ellipse, apply the mask
          if (currentShape === 'circle' || currentShape === 'ellipse') {
            finalCanvas = applyShapeMask(croppedCanvas);
          }

          // Send the cropped image to the server with original size
          saveCroppedImage(finalCanvas);

          // Optionally, display the cropped image in the gallery
          addToGallery(finalCanvas);

          // Set up the canvas for rendering
          canvasElement.width = finalCanvas.width;
          canvasElement.height = finalCanvas.height;
          const ctx = canvasElement.getContext('2d');
          ctx.drawImage(finalCanvas, 0, 0);

          dropZone.style.display = "block";
          imageContainer.style.display = "none";
        }
        scrollToElementById("image-gallery_photo");
      }
      // if(clickedClass=="file-input-for-image")
      // {
      //   const file = event.target.files[0];
      //   const reader = new FileReader();
      //   reader.onload = function (e) {
      //     imageElement.src = e.target.result;
      //     imageContainer.style.display = 'block';
      //     initializeCropper(imageElement);
      //   };
      //   reader.readAsDataURL(file);
      // }
      if(clickedClass=="image-upload-capture-button")
      {
        const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = videoWidth;
          canvas.height = videoHeight;

          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          imageElement.src = canvas.toDataURL('image/jpeg');
          imageContainer.style.display = 'block';
          videoContainer.style.display = 'none';
          initializeCropper(imageElement);
          stopWebcamStream();
      }
      if(clickedClass=="crop-shape-btn")
      {
        currentShape = e.target.getAttribute('data-shape');
        createGlobalVariable(uploaderId+"_cropshape",currentShape);
        initializeCropper(imageElement);
      }
      if(clickedClass=="image-upload-rotate")
      {
        cropper=window[uploaderId+"_cropper"];
        if (cropper) {
          cropper.rotate(90);
        }
      }
      if(clickedClass=="image-upload-cancel-vide-button")
      {
        dropZone.style.display = "block";
        videoContainer.style.display = 'none';
        stopWebcamStream();
      }
      if(clickedClass=="image-upload-cancel-crop")
      {
        dropZone.style.display = "block";
        videoContainer.style.display = 'none';
        imageContainer.style.display = "none";
        file_input.value = '';
      }
      if(clickedClass=="image-upload-web-cam")
      {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(mediaStream => {
          stream = mediaStream;
          videoContainer.style.display = 'block';
          dropZone.style.display = "none";
          videoElement.srcObject = stream;

          videoElement.onloadedmetadata = () => {
            updateCaptureFrameSize();
            videoElement.play();
          };

          window.addEventListener('resize', updateCaptureFrameSize);
        })
        .catch(error => {
          alert("Unable to access webcam.");
        });
      }
      // Function to add cropped image to the gallery
      function addToGallery(croppedCanvas) {
        const gallery = document.getElementById('image-gallery_'+uploaderId);
        const imageItem = document.createElement('div');
        imageItem.classList.add('image-item_'+uploaderId);
        imageItem.classList.add('image-upload-image-item');

        const img = document.createElement('img');
        img.src = croppedCanvas.toDataURL('image/jpeg');
        imageItem.appendChild(img);

        // Add click event to allow the image to be re-cropped
        img.addEventListener('click', () => {
          imageElement.src = img.src;
          imageContainer.style.display = 'block';
          initializeCropper(imageElement);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn_'+uploaderId);
        deleteBtn.classList.add('image-upload-delete-btn');
        deleteBtn.setAttribute('data-id', uploaderId); 
        deleteBtn.textContent = 'X';
        deleteBtn.onclick = () => {
          // Remove the image item from the gallery
          imageItem.remove();

          // Get the current value of imgpath_${id}
          const imgPathElement = document.getElementById('imgpath_'+uploaderId);
          if (imgPathElement) {
            let imgPaths = imgPathElement.value.split('[pics~pics]').filter(path => path.trim() !== ''); // Remove empty values

            let indexToRemove = imgPaths.findIndex(path => path && img.src.endsWith(path));

            if (indexToRemove !== -1)
                imgPaths.splice(indexToRemove, 1); // Remove the matching element
            // Update the imgpath_${id} with the remaining paths
            imgPathElement.value = imgPaths.join('[pics~pics]'); // Rejoin the paths with the delimiter
          }
        };

        imageItem.appendChild(deleteBtn);
        gallery.appendChild(imageItem);
      }
      // Function to send the cropped image to the server
      function saveCroppedImage(croppedCanvas) {
        const dataUrl = croppedCanvas.toDataURL('image/jpeg'); // Convert canvas to base64

        // Create a POST request to send the image to the server
        fetch('/upload-cropped-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: dataUrl }), // Send the base64 data
        })
          .then(response => response.json())
          .then(data => {
            // Successfully saved, display the image using the returned path
            if (data.success) {
              const imageItems = document.querySelectorAll('.image-item_'+uploaderId);
              // Get the last image item
              const lastImageItem = imageItems[imageItems.length - 1];

              // Find the img element within the last image item
              const imgElement = lastImageItem.querySelector('img');

                // If an img element exists, update its src attribute
                if (imgElement) {
                  imgElement.src = data.path;
                }
                document.getElementById("imgpath_"+uploaderId).value=document.getElementById("imgpath_"+uploaderId).value +"[pics~pics]"+ data.path;
            }
          })
          .catch(error => {
            console.error('Error uploading image:', error);
          });
      }
      function applyShapeMask(croppedCanvas) {
        const maskCanvas = document.createElement('canvas');
        const ctx = maskCanvas.getContext('2d');
        const width = croppedCanvas.width;
        const height = croppedCanvas.height;

        maskCanvas.width = width;
        maskCanvas.height = height;

        // Create the circular or elliptical clipping path
        ctx.beginPath();
        if (currentShape === 'circle') {
          ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        } else if (currentShape === 'ellipse') {
          ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        }
        ctx.clip();

        // Draw the cropped image on the canvas with the mask applied
        ctx.drawImage(croppedCanvas, 0, 0);
        return maskCanvas;
      }
      function initializeCropper(image) {
          cropper = window[uploaderId+"_cropper"]
          currentShape = window[uploaderId+"_cropshape"];
          if (cropper) {
            cropper.destroy();
          }
          cropper = new Cropper(image, {
            aspectRatio: currentShape === 'square' ? 1 : NaN,
            viewMode: 2,
            responsive: true,
            guides: true,
            cropBoxResizable: true,
            dragMode: 'move',
            minCropBoxWidth: 100,
            minCropBoxHeight: 100,
            ready() {
              if (currentShape === 'circle' || currentShape === 'ellipse') {
                image.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
                cropper.cropBox.style.borderRadius = currentShape === 'circle' ? '50%' : '30%';
                cropper.cropBox.style.overflow = 'hidden';
              }
            },
          });
          dropZone.style.display = "none";
          createGlobalVariable(uploaderId+"_cropper",cropper);
        }

      function updateCaptureFrameSize() {
        if (videoElement && captureFrame) {
          if (videoElement.videoWidth && videoElement.videoHeight) {
            captureFrame.style.width = videoElement.videoWidth + 'px';
            captureFrame.style.height = videoElement.videoHeight + 'px';
          }
        }
      }
      function stopWebcamStream() {
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          document.getElementById('video-container_'+uploaderId).style.display = 'none';
        }
      }
    }
  });
  
});

function generateImageTag(path, id, className, style) {
  const imagePathParts = path.split("[pics~pics]").filter(item => item.trim() !== "");
  // If the array is empty, return "No"
  if (imagePathParts.length === 0)
    return "No";
  // Create an array to store the generated <img> tags
  let imgTags = [];

  // Loop through the path parts and generate the <img> tags
  imagePathParts.forEach(item => {
    const imgTag = `<img src="${item}" id="${id}" class="${className}" style="${style}" alt="Image">`;
    imgTags.push(imgTag);
  });

  // Return the array of generated <img> tags, or join them as a single string
  return imgTags.join(""); // If you want to return them as a single string, you can join them with an empty string
}

function clearUploader(id)
{
  Si("image-gallery_"+id,"");
  Sv("imgpath_photo","");
}

function createInputElement({
  type, id, placeholder, className, onClick, onKeyUp, 
  othersForInput, othersForPlaceHolder, othersForDiv, value, att, attValue
}) {
  let divClass = 'input-containeri';
  if (othersForDiv) {
    divClass += ` ${othersForDiv.replace('class="', '').replace('"', '')}`;
  }

  let defaultValue = value || '';
  if (type === 'date' && !defaultValue) {
    defaultValue = new Date().toISOString().split('T')[0];
  } else if (type === 'time' && !defaultValue) {
    defaultValue = ''; // Empty value for time input
  } else if (type === 'datetime-local' && !defaultValue) {
    const now = new Date();
    defaultValue = now.toISOString().slice(0, 16);
  }
  
  const labelElement = `<label for="${id}" id="cus-in-lab-${id}" ${othersForPlaceHolder}>${placeholder || 'Sample'}</label>`;
  const inputElement = `<input ${type ? `type="${type}"` : 'text'} 
    id="${id}" name="${id}" class="${className || ''}"  
    ${onClick ? `onclick="${onClick}"` : ''} 
    ${onKeyUp ? `onkeyup="${onKeyUp}"` : ''} 
    ${att ? `${att}="${attValue}"` : ''} 
    value="${defaultValue}" ${othersForInput} autocomplete="current-password">`;
  
  return `<div id='cus-div-${id}' class="${divClass}" ${othersForDiv ? othersForDiv : ''}>${labelElement}${inputElement}</div>`;
}

// Function to generate textarea element HTML
function createTextAreaElement({
  id, placeholder, className, onClick, onKeyUp, 
  othersForTextArea, othersForPlaceHolder, othersForDiv, rows, cols
}) {
  let divClass = 'input-containeri';
  if (othersForDiv) {
    divClass += ` ${othersForDiv.replace('class="', '').replace('"', '')}`;
  }

  const labelElement = `<label for="${id}" id="cus-in-lab-${id}" ${othersForPlaceHolder}>${placeholder || 'Sample'}</label>`;
  const textAreaElement = `<textarea id="${id}" name="${id}" class="${className || ''}"
    ${onClick ? `onclick="${onClick}"` : ''} ${onKeyUp ? `onkeyup="${onKeyUp}"` : ''}
    ${rows ? `rows="${rows}"` : ''} ${cols ? `cols="${cols}"` : ''} ${othersForTextArea}></textarea>`;

  return `<div id='cus-div-${id}' class="${divClass}" ${othersForDiv ? othersForDiv : ''}>${labelElement}${textAreaElement}</div>`;
}

function createCustomCheckbox({
  id, className, placeholder, style, checked, label = "left"
}) {
  // Label element, can have extra attributes or styles
  let labelElement;
  let checkboxSpan;
  
  if (label === "left") {
    labelElement = `<label for="${id}" id="cus-checkbox-label" class="custom-checkbox">${placeholder || 'Sample Checkbox'}`;
    checkboxSpan = `<span class="checkbox" id="cus-checkbox-${id}"></span>`;
  } else {
    labelElement = `<label for="${id}" id="cus-checkbox-label" class="custom-checkbox">`;
    checkboxSpan = `<span class="checkbox" id="cus-checkbox-${id}"></span>${placeholder || 'Sample Checkbox'}`;
  }
  
  // Checkbox input element with the provided class and any other attributes
  const checkboxElement = `<input type="checkbox" id="${id}" style="${style || ''}" class="${className || ''}" ${checked ? 'checked' : ''} />`;
  
  // Returning the structure as a div that wraps the checkbox and its label
  return `<div id="cus-div-${id}" class="checkbox-container">
            ${labelElement}
            ${checkboxElement}
            ${checkboxSpan}
          </label></div>`;
}

function selectBoxes({id, options, classes}) {
  const optionsArray = options.split(',');  // Split string by comma
  let optionElement = "";

  optionsArray.forEach(option => {
      const [value, label, disabled] = option.split(':');  // Split each option by colon, include disabled flag
      const disabledAttr = (disabled === '0' || disabled === undefined || disabled === '') ? '' : 'disabled'; // If the third part is 0 or empty, the option is enabled, else it's disabled
      optionElement += `<option value="${value}" ${disabledAttr}>${label}</option>`;  // Set the value and disabled attribute
  });
  let modCls = ``;
  if(classes)
    modCls = `${classes} `;

  return `<style>
      /* custom_dropdown Menu Item */
      .custom_dropdown-menu-inner_${id} .custom_dropdown-menu-item_${id}:nth-child(even) {
          background-color: lightblue;
      }
      .custom_dropdown-menu-item_${id}.is-select,
      .custom_dropdown-menu-item_${id}.is-select:hover {
          color: var(--color-white);
          background-color: var(--color-blues);
          border: 2px solid blue; /* Add this line for the border */
      }

      .custom_dropdown-menu-item_${id}.disabled {
          color: var(--color-grey);
          background-color: #f0f0f0;
          cursor: not-allowed;
      }

      /* custom_dropdown */
      .custom_dropdown-menu_${id} {
          box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
      }

      .custom_dropdown_${id} {
          box-shadow: rgba(0, 0, 0, 0.05) 0px 6px 24px 0px,
              rgba(0, 0, 0, 0.08) 0px 0px 0px 1px;
      }

      .custom_dropdown-menu-search_${id} {
          width: -webkit-fill-available;
          box-shadow: rgba(0, 0, 0, 0.05) 0px 6px 24px 0px,
              rgba(0, 0, 0, 0.08) 0px 0px 0px 1px;
          border-radius: 10px;
      }

      .custom_dropdown_${id} {
          position: relative;
      }

      .custom_dropdown-select_${id} {
          position: relative;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
          width: 100%;
          height: auto;
          padding: 0.20rem 1.25rem;
          border: 1px solid gray;
          outline: none;
          border-radius: 0.25rem;
          color: var(--color-black);
          background: white;
          box-shadow: var(--shadow-medium);
          transition: all 0.3s ease-in-out;
      }

      .custom_dropdown-select_${id}:focus {
          border: 3px solid gray;
      }

      .custom_dropdown-menu_${id} {
          position: absolute;
          display: none;
          background: white;
          color:black !important;
          top: 100%;
          left: 0;
          width: max-content;
          z-index: 10;
          border-radius: 0.25rem;
          transition: all 0.3s ease-in-out;
      }

      .select-group_${id} {
          width: max-content;
      }

      .custom_dropdown-menu-inner_${id} {
          max-height: 16rem;
          overflow-y: scroll;
          overflow-x: hidden;
      }

      .custom_dropdown-menu-inner_${id}::-webkit-scrollbar {
          width: 5px;
          height: auto;
      }

      .custom_dropdown-menu-inner_${id}::-webkit-scrollbar-thumb {
          border-radius: 0.25rem;
          background-color: var(--color-greys);
          box-shadow: var(--shadow-small);
      }

      .custom_dropdown-menu-item_${id} {
          font-family: inherit;
          font-size: 1rem;
          font-weight: normal;
          line-height: inherit;
          cursor: pointer;
          user-select: none;
          padding: 0.65rem 1.25rem;
          background-color: var(--color-white);
          transition: all 0.2s ease-in-out;
      }

      .custom_dropdown-menu-item_${id}:hover {
          color: var(--color-black);
          background-color: var(--color-greys);
      }

      .custom_dropdown-menu-item_${id}.is-select,
      .custom_dropdown-menu-item_${id}.is-select:hover {
          color: var(--color-white);
          background-color: var(--color-blues);
      }

      .custom_dropdown-menu-search_${id} {
          display: block;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          width: 100%;
          height: auto;
          padding: 0.65rem 1.25rem;
          border: none;
          outline: none;
          color: var(--color-black);
          background-clip: padding-box;
          background-color: var(--color-light);
      }
      .custom_flex_div_${id}
      {
        display: flex;
        align-items:center;
      }
  </style>
  <div class="select-group_${id} ${classes}">
      <select name="${id}" id="${id}" class="${modCls}custom_dropdown_${id}">
          ${optionElement}
      </select>
  </div>`;
}

function serr(id, action = 'toggle') {
  const element = document.getElementById(id);
  
  if (!element) {
    console.error(`Element with ID "${id}" not found`);
    return;
  }

  // ClassList actions
  const actions = {
    add: () => element.classList.add('error-border'),
    remove: () => element.classList.remove('error-border'),
    toggle: () => element.classList.toggle('error-border')
  };

  actions[action]?.(); // Safe execution
}

/**
 * Handles common event triggers for a DOM element
 * @param {string} id - The ID of the DOM element
 * @param {string} eventType - The event type ('click', 'change', 'input', 'keyup', 'submit')
 */
function handleEvent(id, eventType) {
  const element = document.getElementById(id);

  if (!element) {
    console.error(`Element with ID "${id}" not found.`);
    return;
  }
  switch (eventType) {
    case 'click':
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(clickEvent);
      break;

    case 'change':
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
      break;

    case 'input':
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      break;

    case 'keyup':
      const keyupEvent = new KeyboardEvent('keyup', { bubbles: true });
      element.dispatchEvent(keyupEvent);
      break;

    case 'submit':
      if (element.tagName === 'FORM') {
        const submitEvent = new Event('submit', {
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(submitEvent);
        // Optional: If you want to actually submit:
        // element.submit();
      } else {
        console.error('Submit event can only be used with form elements');
      }
      break;

    default:
      console.error(`Unsupported event type: ${eventType}`);
  }
}
