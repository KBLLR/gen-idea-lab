/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { setInputImage } from '../lib/actions';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

export default function ImageUploader() {
    const handleFileChange = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setInputImage(base64);
            } catch (error) {
                console.error("Error converting file to base64:", error);
            }
        }
    };
    
    // Basic drag and drop prevention to allow file input to work
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => e.preventDefault();

    return (
        <div className="image-uploader" onDragOver={handleDragOver} onDrop={handleDrop}>
            <span className="icon">add_photo_alternate</span>
            <h3>Upload a Portrait</h3>
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
