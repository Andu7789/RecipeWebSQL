document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'recipe');  // Replace with your Upload Preset name

    // Cloudinary URL for upload
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dbaqbbsge/image/upload';

    fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Display uploaded image preview
        const preview = document.getElementById('preview');
        const img = document.createElement('img');
        img.src = data.secure_url;
        img.alt = 'Uploaded Image';
        preview.innerHTML = '';
        preview.appendChild(img);

        // Optional: Log the image URL for use elsewhere
        console.log('Image URL:', data.secure_url);
    })
    .catch(error => {
        console.error('Error uploading image:', error);
    });
});

const imageUrl = 'https://res.cloudinary.com/dbaqbbsge/image/upload/v1724438515/rh29ispo0dk1givyiwc6.png';

// Display the image
const preview2 = document.getElementById('preview2');
const imgElement = document.createElement('img');
imgElement.src = imageUrl;
imgElement.alt = 'Sample Image';
//document.body.appendChild(imgElement);

preview2.innerHTML = '';
preview2.appendChild(imgElement);

