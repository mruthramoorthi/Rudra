
 // Get modal and elements
const modal = document.getElementById("imgModal");
const modalImg = document.getElementById("modalImg");
const closeModal = document.getElementById("closeModal");

// Select all tooltips and wrappers on the page
const wrappers = document.querySelectorAll('.wrapper');

wrappers.forEach(wrapper => {
  const tooltip = wrapper.querySelector('.nosil');

  // Function to update tooltip position
  function updateTooltipPosition(event) {
    const wrapperRect = wrapper.getBoundingClientRect();
    
    // Calculate the tooltip's position based on the cursor's position
    const tooltipX = event.clientX - wrapperRect.left;  // Horizontal distance from the left of the wrapper
    const tooltipY = event.clientY - wrapperRect.top;   // Vertical distance from the top of the wrapper
    
    // Position the tooltip at the cursor's position
    tooltip.style.left = `${tooltipX}px`;  
    tooltip.style.top = `${tooltipY-5}px`;  // You can adjust this to position the tooltip above or below
    
    // Optionally adjust tooltip arrow positioning here
    tooltip.style.transform = `translate(-50%, -10px)`;  // Adjust for tooltip center
  }

  // Add event listeners for mouse movements
  wrapper.addEventListener('mousemove', updateTooltipPosition);
  
  wrapper.addEventListener('mouseenter', () => {
    tooltip.style.opacity = 1;
  });
  
  wrapper.addEventListener('mouseleave', () => {
    tooltip.style.opacity = 0;
  });
});


// Event delegation: Attach event listener to the parent container of images

document.addEventListener("click", function(event) {
    // Check if the clicked element is an image
    if (event.target && event.target.tagName === "IMG" && event.target.classList.contains("popup-img")) {
        // Get the src of the clicked image
        const src = event.target.src;
        // Set the src to the modal's image element
        modalImg.src = src;
        // Show the modal
        modal.style.display = "block";
    }
});

// Add event listener for keydown
document.addEventListener('keydown', function(event) {
    // Check if Alt and S are pressed
    if (event.altKey && event.key === 's') {
        // Trigger click on the element with class 'trigger-btn'
        const button = document.querySelector('.burger-icon2');
        if (button) {
            button.click();
            document.getElementsByClassName("custom_dropdown-menu_search-page")[0].style.display = "block";
            document.querySelector('.custom_dropdown-menu-search_search-page').focus();
        }
    }
    if (event.altKey && event.key === 'q') {
        // Trigger click on the element with class 'trigger-btn'
        const button = document.getElementById('sign-out');
        if (button) {
        button.click();
        }
    }
    if (event.altKey && event.key === 'h') {
        // Trigger click on the element with class 'trigger-btn'
        const button = document.getElementById('home-in');
        if (button) {
        button.click();
        }
    }
    if (event.altKey && event.key === 'c') {
        // Trigger click on the element with class 'trigger-btn'
        const button = document.getElementById('profile-sts');
        if (button) {
        button.click();
        }
    }
  });

// When the user clicks on the close button, close the modal
closeModal.addEventListener("click", function() {
    modal.style.display = "none";
});

// If the user clicks outside the modal image, close the modal
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
