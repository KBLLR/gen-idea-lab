/**
 * @file ImageUploader - Image file upload component with drag-and-drop
 * @license SPDX-License-Identifier: Apache-2.0
*/
import { setInputImage } from '@shared/lib/actions.js';
import { fileToBase64 } from '@shared/lib/fileUtils.js';
import { handleAsyncError } from '@shared/lib/errorHandler.js';

export default function ImageUploader() {
    const handleFileChange = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setInputImage(base64);
            } catch (error) {
                handleAsyncError(error, {
                    context: 'Converting uploaded image to base64',
                    showToast: true,
                    fallbackMessage: 'Failed to process uploaded image. Please try a different file.'
                });
            }
        }
    };
    
    // Basic drag and drop prevention to allow file input to work
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => e.preventDefault();

    return (
        <div className="image-uploader" onDragOver={handleDragOver} onDrop={handleDrop}>
            <span className="icon">add_photo_alternate</span>
            <h3>Upload reference image</h3>
            <p>Drag & drop an image here, or click to select a file.</p>
            <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleFileChange}
                title="Select an image to upload"
            />
        </div>
    );
}
