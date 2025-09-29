/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useMemo } from 'react';
import { useRef } from 'react';
import useStore from '../lib/store';
import { generateImage, setInputImage } from '../lib/actions';
import ImageUploader, { fileToBase64 } from './ImageUploader';
import modes from '../lib/modes';
import descriptions from '../lib/descriptions';
import { getImageProviderLabel, DEFAULT_IMAGE_MODELS } from '../lib/imageProviders';

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
    const inputImage = useStore.use.inputImage();
    const outputImage = useStore.use.outputImage();
    const isGenerating = useStore.use.isGenerating();
    const activeModeKey = useStore.use.activeModeKey();
    const generationError = useStore.use.generationError();
    const connectedServices = useStore.use.connectedServices();
    const imageProvider = useStore.use.imageProvider();
    const imageModel = useStore.use.imageModel();
    const setImageProvider = useStore((state) => state.actions.setImageProvider);
    const setImageModel = useStore((state) => state.actions.setImageModel);
    const modeDetails = getModeDetails(activeModeKey);
    const fileInputRef = useRef(null);

    const providerOptions = useMemo(() => {
        const options = [
            { value: 'gemini', label: getImageProviderLabel('gemini') }
        ];

        if (connectedServices.openai?.connected) {
            options.push({ value: 'openai', label: getImageProviderLabel('openai') });
        }

        if (connectedServices.drawthings?.connected) {
            options.push({ value: 'drawthings', label: getImageProviderLabel('drawthings') });
        }

        if (imageProvider && !options.some(option => option.value === imageProvider)) {
            options.unshift({ value: imageProvider, label: getImageProviderLabel(imageProvider) });
        }

        return options;
    }, [connectedServices, imageProvider]);

    const currentModelValue = imageModel ?? DEFAULT_IMAGE_MODELS[imageProvider] ?? '';

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

    const handleFileSelection = async (file) => {
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            setInputImage(base64);
        } catch (error) {
            console.error('Error converting file to base64:', error);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files && event.target.files[0];
        await handleFileSelection(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleReplaceTrigger = () => {
        fileInputRef.current?.click();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleReplaceTrigger();
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        await handleFileSelection(file);
    };

    return (
        <div className="booth-viewer">
            {/* Header Section with Detailed Information */}
            <div className="booth-header">
                <div className="booth-title">
                    <h1>{modeDetails.emoji} {modeDetails.name}</h1>
                    <div className="mode-meta">
                        <span className="mode-type">VizGen Transformation</span>
                        <span className="mode-status">Ready</span>
                    </div>
                </div>

                <div className="booth-description">
                    <p className="description-text">{modeDetails.description}</p>
                    <div className="prompt-info">
                        <h4>AI Prompt</h4>
                        <p className="prompt-text">"{modeDetails.prompt}"</p>
                    </div>
                </div>

                <div className="booth-actions">
                    <div className="provider-controls">
                        <label htmlFor="image-provider-select" className="provider-label">
                            Image Provider
                        </label>
                        <select
                            id="image-provider-select"
                            value={imageProvider}
                            onChange={(e) => setImageProvider(e.target.value)}
                            className="provider-select"
                        >
                            {providerOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="image-provider-model" className="provider-label secondary">
                            Model (optional)
                        </label>
                        <input
                            id="image-provider-model"
                            type="text"
                            value={currentModelValue || ''}
                            onChange={(e) => setImageModel(e.target.value)}
                            placeholder={DEFAULT_IMAGE_MODELS[imageProvider] || 'Leave blank for provider default'}
                            className="provider-model-input"
                        />
                    </div>
                    <button
                        className="booth-generate-btn primary"
                        onClick={generateImage}
                        disabled={isGenerating}
                    >
                        <span className="icon">auto_awesome</span>
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="booth-main">
                {isGenerating && <LoadingSpinner />}
                <div className="current-work">
                    <div className="image-container input-container">
                        <div className="image-header">
                            <h3>Input Image</h3>
                            <span className="image-info">Source</span>
                        </div>
                        <div
                            className="image-content replaceable"
                            role="button"
                            tabIndex={0}
                            aria-label="Replace input image"
                            onClick={handleReplaceTrigger}
                            onKeyDown={handleKeyDown}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <img src={inputImage} alt="Input" />
                            <div className="replace-overlay" aria-hidden="true">
                                <span className="icon">upload</span>
                                <span>Replace image</span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                onChange={handleFileChange}
                                hidden
                                aria-hidden="true"
                                tabIndex={-1}
                            />
                        </div>
                    </div>

                    <div className="transformation-arrow">
                        <span className="icon">arrow_forward</span>
                        <span className="transform-label">{modeDetails.name}</span>
                    </div>

                    <div className="image-container output-container">
                        <div className="image-header">
                            <h3>Generated Result</h3>
                            <span className="image-info">
                                {outputImage ? 'Complete' : 'Pending'}
                            </span>
                        </div>
                        <div className="image-content">
                            {outputImage ? (
                                <img src={outputImage} alt="Generated Output" />
                            ) : (
                                <div className="placeholder">
                                    <span className="icon">
                                        {generationError ? 'error' : 'auto_awesome'}
                                    </span>
                                    <p>
                                        {generationError
                                            ? 'Generation failed'
                                            : 'Click Generate to create result'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                        {outputImage && (
                            <div className="image-actions">
                                <button className="image-action-btn">
                                    <span className="icon">download</span>
                                    Download
                                </button>
                                <button className="image-action-btn">
                                    <span className="icon">share</span>
                                    Share
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {generationError && (
                    <div className="error-display">
                        <span className="icon">error</span>
                        <div>
                            <h4>Generation Error</h4>
                            <p>{generationError}</p>
                        </div>
                        <button onClick={() => useStore.setState({ generationError: null })}>
                            <span className="icon">close</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Section with Generation History */}
            <div className="booth-footer">
                <div className="history-header">
                    <h3>Generation History</h3>
                    <span className="history-count">Recent transformations with {modeDetails.name}</span>
                </div>
                <div className="history-scroll">
                    {/* This would be populated with actual history once we add that feature */}
                    <div className="history-placeholder">
                        <span className="icon">history</span>
                        <p>Your generated images will appear here</p>
                        <small>Start generating to build your transformation history</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
