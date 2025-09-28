/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { generateImage } from '../lib/actions';
import ImageUploader from './ImageUploader';
import modes from '../lib/modes';
import descriptions from '../lib/descriptions';

const getModeDetails = (modeKey) => {
    for (const [categoryName, category] of Object.entries(modes)) {
        for (const [subCategoryName, subCategory] of Object.entries(category)) {
            if (subCategory[modeKey]) {
                return {
                    ...subCategory[modeKey],
                    description: descriptions[categoryName]?.[subCategoryName]?.[modeKey]?.description || ''
                };
            }
        }
    }
    return null;
};

const LoadingSpinner = () => (
    <div className="loading-overlay">
        <div className="spinner"></div>
    </div>
);

export default function BoothViewer() {
    const { inputImage, outputImage, isGenerating, activeModeKey, generationError } = useStore.getState();
    const modeDetails = getModeDetails(activeModeKey);

    if (!inputImage) {
        return <ImageUploader />;
    }

    if (!modeDetails) {
        return (
            <div className="module-viewer-placeholder">
                <span className="icon">error</span>
                <h2>Mode not found. Please select a mode from the left.</h2>
            </div>
        );
    }

    return (
        <div className="booth-viewer">
            <div className="booth-header">
                <div className="booth-header-info">
                    <h2>{modeDetails.emoji} {modeDetails.name}</h2>
                    <p>{modeDetails.description}</p>
                </div>
                <button 
                  className="booth-generate-btn" 
                  onClick={generateImage} 
                  disabled={isGenerating}
                >
                    <span className="icon">auto_awesome</span>
                    Generate
                </button>
            </div>

            <div className="image-previews">
                {isGenerating && <LoadingSpinner />}
                <div className="image-container">
                    <h4>Input</h4>
                    <img src={inputImage} alt="Input" />
                </div>
                <div className="image-container">
                    <h4>Output</h4>
                    {outputImage ? (
                        <img src={outputImage} alt="Output" />
                    ) : (
                        <div className="placeholder icon">
                            {generationError ? 'broken_image' : 'photo_spark'}
                        </div>
                    )}
                </div>
                {generationError && <div className="error-message">{generationError}</div>}
            </div>
        </div>
    );
}
