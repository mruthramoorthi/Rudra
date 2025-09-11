// helpers.js
const hbs = require('hbs');
const moment = require('moment');

// // Function to generate input element HTML
// function createInputElement({
//   type, id, placeholder, className, onClick, onKeyUp, 
//   othersForInput, othersForPlaceHolder, othersForDiv, value
// }) {
//   let divClass = 'input-containeri';
//   if (othersForDiv) {
//     divClass += ` ${othersForDiv.replace('class="', '').replace('"', '')}`;
//   }

//   let defaultValue = value || '';
//   if (type === 'date' && !defaultValue) {
//     defaultValue = new Date().toISOString().split('T')[0];
//   } else if (type === 'time' && !defaultValue) {
//     const now = new Date();
//     defaultValue = now.toTimeString().split(' ')[0].substring(0, 5);
//   } else if (type === 'datetime-local' && !defaultValue) {
//     const now = new Date();
//     defaultValue = now.toISOString().slice(0, 16);
//   }
//   const labelElement = `<label for="${id}" id="cus-in-lab-${id}" ${othersForPlaceHolder}>${placeholder || 'Sample'}</label>`;
//   const inputElement = `<input ${type ? `type="${type}"` : 'text'}
//     id="${id}" name="${id}" class="${className || ''}"  
//     ${onClick ? `onclick="${onClick}"` : ''} 
//     ${onKeyUp ? `onkeyup="${onKeyUp}"` : ''} 
//     value="${defaultValue}" ${othersForInput} autocomplete="current-password">`;
  
//   return `<div id='cus-div-${id}' class="${divClass}" ${othersForDiv ? othersForDiv : ''}>${labelElement}${inputElement}</div>`;
// }

function exchange()
{
  return `<div class="exchange-div">
              <table class="table-bordered custom-exchange-design">
                  <thead><th>S.no</th><th>Metal</th><th>Code</th><th>Ex-Type</th><th>Gram</th><th>Amount</th><th>Action</th></thead>
                  <tbody id="excahnge-tbody"></tbody>
                  <tbody>
                      <td colspan="7">
                          <div class='old-ship'>
                              <button id='old-btn' type='button'><img src="/images/exchange.png" class="stone"> Click to Add Exchange</button>
                          </div>
                          <div id="olddetails" class="sheet"></div>
                      </td>
                  </tbody>
                  <tfoot><th colspan="5">Total Exchange Amount</th><th id="total-exchange-amount" class="right-align">0</th><th></th></tfoot>
              </table>
              <input type="hidden" name="oldpart" id="oldpart" value="">
              <input type="hidden" name="exchangeFunction" id="exchangeFunction" class="exchangeFunction" value="0">
          </div>`;
}

function bank_transactions()
{
  return `<div class="bank">
            <table class="table-bordered custom-banking-design">
                <thead><th>S.no</th><th>Bank</th><th>Amount</th><th>Action</th></thead>
                <tbody id="banking-tbody"></tbody>
                <tbody>
                    <td colspan="5">
                        <div class="bank-ship">
                            <button type="button" id="bank-btn" class="banking-amt">Click to Add Bank Amount</button>
                        </div>
                        <div class="sheet banking-sheet" id="banking-sheet">
                            
                        </div>
                    </td>
                </tbody>
                <tfoot><th colspan="2">Total Banking Amount</th><th id="total-banking-amount" class="right-align">0</th><th></th></tfoot>
            </table>
            <input type="hidden" name="bankpart" id="bankpart" value="">
            <input type="hidden" name="bankingFunction" id="bankingFunction" class="bankingFunction" value="0">
          </div>`;
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


// toggle check box
{/* <div class="toggle-container">
    <label class="toggle">
      <input type="checkbox" class="toggle-input">
      <span class="toggle-slider"></span>
    </label>
  </div> */}

  // Function to generate image uploader HTML
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

// image uploader
// Function to generate image uploader HTML
// function imageLoader2({id, noncei, placeholder}) {
//   return `
//     <link href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css" rel="stylesheet">
//     <style>
//       /* Styles (same as original, just replace _id1 with ${id} dynamically) */
//       #image-container_${id} {
//         display: none;
//         margin-top: 20px;
//       }
//       .options {
//         margin-bottom: 20px;
//       }
//       #video-container_${id} {
//         position: relative;
//         display: none;
//         width: 100%;
//       }
//       #video_${id} {
//         width: 30%;
//         border: 1px solid black;
//       }
//       #capture-frame_${id} {
//         position: absolute;
//         border: 2px solid red;
//         top: 0;
//         left: 0;
//         width: 100%;
//         height: 100%;
//         pointer-events: none;
//       }
//       .crop-shape-btn {
//         margin-right: 10px;
//         cursor: pointer;
//       }
//       #drop-zone-for-image_${id}.over {
//         background-color: #f0f0f0;
//         color: #333;
//       }
//       #file-input-for-image_${id} {
//         display: none;
//       }
//       .image-item_${id} {
//         position: relative;
//         display: inline-block;
//         margin: 10px;
//       }
//       .image-item_${id} img {
//         max-width: 200px;
//         border-radius: 8px;
//         cursor: pointer;
//       }
//       .delete-btn_${id} {
//         position: absolute;
//         top: 5px;
//         right: 5px;
//         background: rgba(255, 0, 0, 0.7);
//         color: white;
//         border: none;
//         border-radius: 50%;
//         cursor: pointer;
//         margin: auto 0 !important;
//         width: 25px;
//         font-size: 20px;
//         height: 25px;
//         text-align: center;
//       }
//       #upload_img_${id}{
//         width: 50px;
//       }
//       #accesser_${id}{
//         display: flex;
//         gap:10px;
//       }
//       #label_${id}{
//         color:red;
//       }
//       #placeholder_${id}{
//       text-align:center;
//       color: blue;
//       font-weight: 800;
//       }
//     </style>
//     <div id="uploader_${id}">
//     <label id="placeholder_${id}">${placeholder}</label>
//     <div id="accesser_${id}">
//       <div id="options_${id}" class="options">
//         <input type="file" id="file-input-for-image_${id}" accept="image/*" multiple />
//         <button type="button" id="webcam-option_${id}">Webcam</button>
//       </div>
//       <div id="drop-zone-for-image_${id}"><img src='/images/photo_upload.png' id="upload_img_${id}"/></div>
//     </div>
//     <div id="label_${id}">Drag & Drop an Image</div>

//     <div id="video-container_${id}">
//       <video id="video_${id}" autoplay></video>
//       <button type="button" id="capture-button_${id}">Capture Image</button>
//       <button type="button" id="cancel-vide-button_${id}">Cancel</button>
//     </div>

//     <div id="image-container_${id}">
//       <button type="button" id="rotate_${id}">Rotate</button>
//       <button type="button" id="square_${id}" class="crop-shape-btn" data-shape="square">Square</button>
//       <button type="button" id="circle_${id}" class="crop-shape-btn" data-shape="circle">Circle</button>
//       <button type="button" id="rectangle_${id}" class="crop-shape-btn" data-shape="rectangle">Rectangle</button>
//       <button type="button" id="ellipse_${id}" class="crop-shape-btn" data-shape="ellipse">Ellipse</button>
//       <button type="button" id="cancel-crop-button_${id}">Cancel</button>
//       <img id="image_${id}" src="" alt="Captured Image" style="max-width: 100%;" />
//       <button type="button" id="crop_${id}">Final</button>
//     </div>
//     <input type="hidden" id="imgpath_${id}" name="imgpath_${id}" value="">
//     <div id="image-gallery_${id}">
//       <!-- Cropped images will appear here -->
//     </div>

//     <canvas id="canvas_${id}" style="max-width: 100%; display: none; margin-top: 20px;"></canvas>
//     </div>
//     <script nonce="${noncei}" src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js"></script>
//     <script nonce="${noncei}">
//       // JavaScript (similar to your original script)
//       let cropper_${id};
//       let imageElement_${id} = document.getElementById('image_${id}');
//       let canvasElement_${id} = document.getElementById('canvas_${id}');
//       let imageContainer_${id} = document.getElementById('image-container_${id}');
//       let videoContainer_${id} = document.getElementById('video-container_${id}');
//       let dropZone_${id} = document.getElementById('drop-zone-for-image_${id}');
//       let videoElement_${id} = document.getElementById('video_${id}');
//       let captureFrame_${id} = document.getElementById('capture-frame_${id}');
//       let currentShape_${id} = 'square';
//       let file_input_${id} = document.getElementById('file-input-for-image_${id}');
//       let stream_${id};

//       document.getElementById('webcam-option_${id}').addEventListener('click', async () => {
//         try {
//           videoContainer_${id}.style.display = 'block';
//           dropZone_${id}.style.display = "none";
//           stream_${id} = await navigator.mediaDevices.getUserMedia({ video: true });
//           videoElement_${id}.srcObject = stream_${id};

//           videoElement_${id}.onloadedmetadata = () => {
//             updateCaptureFrameSize_${id}();
//             videoElement_${id}.play();
//           };

//           window.addEventListener('resize', updateCaptureFrameSize_${id});
//         } catch (error) {
//           alert("Unable to access webcam.");
//         }
//       });

//       function updateCaptureFrameSize_${id}() {
//         if (videoElement_${id} && captureFrame_${id}) {
//           if (videoElement_${id}.videoWidth && videoElement_${id}.videoHeight) {
//             captureFrame_${id}.style.width = videoElement_${id}.videoWidth + 'px';
//             captureFrame_${id}.style.height = videoElement_${id}.videoHeight + 'px';
//           }
//         }
//       }

//       function stopWebcamStream_${id}() {
//         if (stream_${id}) {
//           const tracks = stream_${id}.getTracks();
//           tracks.forEach(track => track.stop());
//           document.getElementById('video-container_${id}').style.display = 'none';
//         }
//       }

//       document.getElementById('cancel-crop-button_${id}').addEventListener('click', () => {
//         dropZone_${id}.style.display = "block";
//         videoContainer_${id}.style.display = 'none';
//         imageContainer_${id}.style.display = "none";
//         file_input_${id}.value = '';
//       });

//       document.getElementById('cancel-vide-button_${id}').addEventListener('click', () => {
//         dropZone_${id}.style.display = "block";
//         videoContainer_${id}.style.display = 'none';
//         stopWebcamStream_${id}();
//       });

//       document.getElementById('capture-button_${id}').addEventListener('click', () => {
//         const videoWidth = videoElement_${id}.videoWidth;
//         const videoHeight = videoElement_${id}.videoHeight;
//         const canvas = document.createElement('canvas');
//         const context = canvas.getContext('2d');
//         canvas.width = videoWidth;
//         canvas.height = videoHeight;

//         context.drawImage(videoElement_${id}, 0, 0, canvas.width, canvas.height);

//         imageElement_${id}.src = canvas.toDataURL('image/jpeg');
//         imageContainer_${id}.style.display = 'block';
//         videoContainer_${id}.style.display = 'none';
//         initializeCropper_${id}(imageElement_${id});
//         stopWebcamStream_${id}();
//       });

//       document.getElementById('file-input-for-image_${id}').addEventListener('change', event => {
//         debugger;
//         const file = event.target.files[0];
//         const reader = new FileReader();
//         reader.onload = function (e) {
//           imageElement_${id}.src = e.target.result;
//           imageContainer_${id}.style.display = 'block';
//           initializeCropper_${id}(imageElement_${id});
//         };
//         reader.readAsDataURL(file);
//       });

//       function initializeCropper_${id}(image) {
//       debugger
//         if (cropper_${id}) {
//           cropper_${id}.destroy();
//         }
//         cropper_${id} = new Cropper(image, {
//           aspectRatio: currentShape_${id} === 'square' ? 1 : NaN,
//           viewMode: 2,
//           responsive: true,
//           guides: true,
//           cropBoxResizable: true,
//           dragMode: 'move',
//           minCropBoxWidth: 100,
//           minCropBoxHeight: 100,
//           ready() {
//             if (currentShape_${id} === 'circle' || currentShape_${id} === 'ellipse') {
//               image.style.borderRadius = currentShape_${id} === 'circle' ? '50%' : '30%';
//               cropper_${id}.cropBox.style.borderRadius = currentShape_${id} === 'circle' ? '50%' : '30%';
//               cropper_${id}.cropBox.style.overflow = 'hidden';
//             }
//           },
//         });
//         dropZone_${id}.style.display = "none";
//       }

//       document.querySelectorAll('.crop-shape-btn').forEach(button => {
//         button.addEventListener('click', (e) => {
//           currentShape_${id} = e.target.getAttribute('data-shape');
//           initializeCropper_${id}(imageElement_${id});
//         });
//       });

//       // Rotate image
//     document.getElementById('rotate_${id}').addEventListener('click', () => {
//       if (cropper_${id}) {
//         cropper_${id}.rotate(90);
//       }
//     });

//     dropZone_${id}.addEventListener('click', () => {
//       // Reset file input value
//       file_input_${id}.value = '';
//       file_input_${id}.click();
//     });

//     // Crop image and add to gallery
//     document.getElementById('crop_${id}').addEventListener('click', () => {
      
//       if (cropper_${id}) {
//         const croppedCanvas = cropper_${id}.getCroppedCanvas({
//           width: cropper_${id}.getImageData().naturalWidth, // Use the natural (original) width
//           height: cropper_${id}.getImageData().naturalHeight, // Use the natural (original) height
//         });
//         let finalCanvas = croppedCanvas;

//         // If the selected shape is circle or ellipse, apply the mask
//         if (currentShape_${id} === 'circle' || currentShape_${id} === 'ellipse') {
//           finalCanvas = applyShapeMask_${id}(croppedCanvas);
//         }

//         // Send the cropped image to the server with original size
//         saveCroppedImage_${id}(finalCanvas);

//         // Optionally, display the cropped image in the gallery
//         addToGallery_${id}(finalCanvas);

//         // Set up the canvas for rendering
//         canvasElement_${id}.width = finalCanvas.width;
//         canvasElement_${id}.height = finalCanvas.height;
//         const ctx = canvasElement_${id}.getContext('2d');
//         ctx.drawImage(finalCanvas, 0, 0);

//         dropZone_${id}.style.display = "block";
//         imageContainer_${id}.style.display = "none";
//       }
//     });
// // Function to send the cropped image to the server
// function saveCroppedImage_${id}(croppedCanvas) {
//   const dataUrl = croppedCanvas.toDataURL('image/jpeg'); // Convert canvas to base64

//   // Create a POST request to send the image to the server
//   fetch('/upload-cropped-image', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ image: dataUrl }), // Send the base64 data
//   })
//     .then(response => response.json())
//     .then(data => {
//       // Successfully saved, display the image using the returned path
//       if (data.success) {
//         const imageItems = document.querySelectorAll('.image-item_${id}');
//         // Get the last image item
//         const lastImageItem = imageItems[imageItems.length - 1];

//         // Find the img element within the last image item
//         const imgElement = lastImageItem.querySelector('img');

//           // If an img element exists, update its src attribute
//           if (imgElement) {
//             imgElement.src = data.path;
//           }
//           document.getElementById("imgpath_${id}").value=document.getElementById("imgpath_${id}").value +"[pics~pics]"+ data.path;
//       }
//     })
//     .catch(error => {
//       console.error('Error uploading image:', error);
//     });
// }

//     // Function to apply a circular or elliptical mask
//     function applyShapeMask_${id}(croppedCanvas) {
//       const maskCanvas = document.createElement('canvas');
//       const ctx = maskCanvas.getContext('2d');
//       const width = croppedCanvas.width;
//       const height = croppedCanvas.height;

//       maskCanvas.width = width;
//       maskCanvas.height = height;

//       // Create the circular or elliptical clipping path
//       ctx.beginPath();
//       if (currentShape_${id} === 'circle') {
//         ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
//       } else if (currentShape_${id} === 'ellipse') {
//         ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
//       }
//       ctx.clip();

//       // Draw the cropped image on the canvas with the mask applied
//       ctx.drawImage(croppedCanvas, 0, 0);
//       return maskCanvas;
//     }

// // Function to add cropped image to the gallery
// function addToGallery_${id}(croppedCanvas) {
//   const gallery = document.getElementById('image-gallery_${id}');
//   const imageItem = document.createElement('div');
//   imageItem.classList.add('image-item_${id}');

//   const img = document.createElement('img');
//   img.src = croppedCanvas.toDataURL('image/jpeg');
//   imageItem.appendChild(img);

//   // Add click event to allow the image to be re-cropped
//   img.addEventListener('click', () => {
//     imageElement_${id}.src = img.src;
//     imageContainer_${id}.style.display = 'block';
//     initializeCropper_${id}(imageElement_${id});
//   });

//   const deleteBtn = document.createElement('button');
//   deleteBtn.classList.add('delete-btn_${id}');
//   deleteBtn.textContent = 'X';
//   deleteBtn.onclick = () => {
//     // Remove the image item from the gallery
//     imageItem.remove();

//     // Get the current value of imgpath_${id}
//     const imgPathElement = document.getElementById('imgpath_${id}');
//     if (imgPathElement) {
    
//       let imgPaths = imgPathElement.value.split('[pics~pics]').filter(path => path.trim() !== ''); // Remove empty values

//       let indexToRemove = imgPaths.findIndex(path => path && img.src.endsWith(path));

//       if (indexToRemove !== -1)
//           imgPaths.splice(indexToRemove, 1); // Remove the matching element
//       // Update the imgpath_${id} with the remaining paths
//       imgPathElement.value = imgPaths.join('[pics~pics]'); // Rejoin the paths with the delimiter
//     }
//   };

//   imageItem.appendChild(deleteBtn);
//   gallery.appendChild(imageItem);
// }


//     // Drag and Drop event listeners
//     dropZone_${id}.addEventListener('dragover', (e) => {
//       e.preventDefault();
//       dropZone_${id}.classList.add('over');
//     });

//     dropZone_${id}.addEventListener('dragleave', () => {
//       dropZone_${id}.classList.remove('over');
//     });

//     dropZone_${id}.addEventListener('drop', (e) => {
//       e.preventDefault();
//       dropZone_${id}.classList.remove('over');
//       const file = e.dataTransfer.files[0];
//       if (file && file.type.startsWith('image/')) {
//         const reader = new FileReader();
//         reader.onload = function(event) {
//           imageElement_${id}.src = event.target.result;
//           imageContainer_${id}.style.display = 'block';
//           initializeCropper_${id}(imageElement_${id});
//         };
//         reader.readAsDataURL(file);
//       } else {
//         alert('Please drop a valid image file.');
//       }
//     });
//     </script>`;
// }

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

function checkRights(data, action, givenDate = null, givenTime = null) {
  // Ensure that 'data' is an array before calling map on it
  
  if (!Array.isArray(data) || data.length === 0) {
    // If data is not an array or is empty, return true
    return true;
  }

  // Convert given date and time into moment objects for comparison, if provided
  const givenDateTime = givenDate && givenTime 
    ? moment(`${givenDate} ${givenTime}`, 'YYYY-MM-DD HH:mm:ss')
    : null;
  
  // Check if the action is valid
  const validActions = ['edit', 'delete', 'view', 'print', 'date_change'];
  if (!validActions.includes(action)) {
    throw new Error('Invalid action provided. Valid actions are: edit, delete, view, print, date_change');
  }

  // Loop through the data array and check each item for the specific action
  const results = data.map(item => {
    // Default to true if the required properties do not exist or are invalid
    if (!item || !item[`${action}_rights`]) { //  || !item[`${action}_condition`] || !item[`${action}_rights_duration_days`] || !item[`${action}_time_limit`]
      // console.warn(`Data for item with uniqueid ${item?.uniqueid || 'unknown'} is missing required fields. Returning 'true' for this item.`);
      return true; // Default to 'true' if data is invalid or missing
    }

    // Default values for rights-related fields, in case they are null
    const rights = item[`${action}_rights`] ?? 0;  // Default to 0 if null (allowed)
    const condition = item[`${action}_condition`] ?? 0;  // Default to 0 if null
    const rightsDurationDays = item[`${action}_rights_duration_days`] ?? 0;  // Default to 0 if null
    const timeLimit = item[`${action}_time_limit`] ?? '00:00:00';  // Default to '00:00:00' if null

    // If the rights are 1, it's not allowed (restricted)
    if (rights === 1) {
      return false; // Not allowed
    }

    // If the rights are 0, it's allowed (priority check)
    if (rights === 0 && rightsDurationDays === 0 && timeLimit === '00:00:00') {
      return true; // Allowed
    }
    // If rightsDurationDays is provided and the given date exists
    if (rightsDurationDays > 0 && givenDate) {
      const givenDateMoment = moment(givenDate);  // Convert givenDate to a moment object
      const daysDifference = givenDateMoment.diff(today, 'days');  // Calculate days difference

      // Check if the given date is within the allowed duration
      if (daysDifference <= rightsDurationDays && daysDifference >= 0 && givenDateTime==="00:00:00") {
        return true; // Allowed based on date range
      }
      // If timeLimit exists and rightsDurationDays is 1, check time validity
      else if (rightsDurationDays === 1 && givenDateTime !=="00:00:00") {
        // The givenDate must be today's date and time must be within the timeLimit range
        if (givenDateTime.isSame(today, 'day')) {
          const allowedTimeDifference = moment(timeLimit, 'HH:mm');  // Convert timeLimit to moment object
          const timeDifference = moment().diff(givenDateTime, 'minutes'); // Calculate the difference in minutes
          // Check if the time difference is within the allowed time
          if (timeDifference <= allowedTimeDifference.diff(moment(), 'minutes') && timeDifference >= 0) {
            return true; // Allowed based on time limit
          } else {
            return false; // Not allowed if outside the time limit
          }
        }
      }
      else
      {
        return false;
      }
    }
      return true; // Allowed by default if no specific duration is set
  
  });

  // Return true if any item is true, otherwise false
  return results.some(result => result === true);
}




// Register helpers with Handlebars
function registerHelpers() {
  hbs.registerHelper('createInput', (options) => new hbs.SafeString(createInputElement(options.hash)));
  hbs.registerHelper('createInputTa', (options) => new hbs.SafeString(createTextAreaElement(options.hash)));
  hbs.registerHelper('imageUpload2', (options) => new hbs.SafeString(imageLoader2(options.hash)));
  hbs.registerHelper('imageUpload', (options) => new hbs.SafeString(imageLoader(options.hash)));
  hbs.registerHelper('selectBox', (options) => new hbs.SafeString(selectBoxes(options.hash)));
  hbs.registerHelper('checkBox', (options) => new hbs.SafeString(createCustomCheckbox(options.hash)));
  hbs.registerHelper('exchange', (options) => new hbs.SafeString(exchange()));
  hbs.registerHelper('bank_transactions', (options) => new hbs.SafeString(bank_transactions()));
  // Register the 'and' helper
  hbs.registerHelper('and', function (a, b) {
    return a && b;
  });
  hbs.registerHelper('or', function (a, b) {
    return a || b;
  });
  // Register the 'checkRights' helper
  hbs.registerHelper('checkRights', function(rights_result, view_rights) {
      return !rights_result || view_rights === 0;
  });
  // Register Handlebars Helper
  hbs.registerHelper('checkingRights', function(options) {
    // Extract parameters from the options.hash (which is passed from the template)
    const data = options.hash.data;
    const action = options.hash.action;
    const givenDate = options.hash.givenDate || null;
    const givenTime = options.hash.givenTime || null;
    
    // Call the checkRights function and return its result
    const result = checkRights(data, action, givenDate, givenTime);
  
    // Return true/false, which will control whether the content is rendered in Handlebars
    return result;
  });
   // Or you can format it however you need for rendering
   hbs.registerHelper('ifEquals', function(a, b, options) {
    if (a === b) {
      return true; // return the block if condition is true
    } else {
      return false; // return the inverse block if condition is false
    }
  });
}

module.exports = { registerHelpers, createInputElement, imageLoader, exchange, bank_transactions, imageLoader, selectBoxes, createCustomCheckbox, checkRights };
