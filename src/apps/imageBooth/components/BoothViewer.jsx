/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useMemo, useRef, useState } from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { Button, Panel } from '@ui';
import FormField from '@components/ui/atoms/FormField.jsx';
import useStore from '@store';
import { generateImage, setInputImage } from '@shared/lib/actions/imageBoothActions.js';
import ImageUploader from '@components/ui/organisms/ImageUploader.jsx';
import { fileToBase64 } from '@shared/lib/fileUtils.js';
import modes from '@apps/imageBooth/lib/modes.js';
import descriptions from '@apps/imageBooth/lib/descriptions.js';
import { getImageProviderLabel, DEFAULT_IMAGE_MODELS } from '@shared/lib/imageProviders.js';

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
            {/* Header Section (shared component) */}
            <BoothHeader
                icon={modeDetails.emoji}
                title={modeDetails.name}
                typeText="VizGen Transformation"
                status={isGenerating ? 'pending' : 'ready'}
                description={modeDetails.description}
                align="top"
                actions={(
                  <>
                    <div className="provider-controls">
                        <FormField label="Image Provider" htmlFor="image-provider-select">
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
                        </FormField>
                        <FormField label="Model (optional)" htmlFor="image-provider-model" secondary>
                          <input
                            id="image-provider-model"
                            type="text"
                            value={currentModelValue || ''}
                            onChange={(e) => setImageModel(e.target.value)}
                            placeholder={DEFAULT_IMAGE_MODELS[imageProvider] || 'Leave blank for provider default'}
                            className="provider-model-input"
                          />
                        </FormField>
                    </div>
                    <Button variant="primary" icon="auto_awesome" onClick={generateImage} disabled={isGenerating || !inputImage} style={{ alignSelf: 'center', minWidth: 200 }}>
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </>
                )}
            >
                <div className="prompt-info">
                    <h4>AI Prompt</h4>
                    <p className="prompt-text">"{modeDetails.prompt}"</p>
                </div>
            </BoothHeader>

            {/* Main Content Section */}
            <div className="booth-main">
                {isGenerating && <LoadingSpinner />}
                <div className="current-work">
                    {inputImage ? (
                      <>
                        <Panel variant="input" title="Input Image" info="Source">
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
                        </Panel>

                        <div className="transformation-arrow">
                          <span className="icon">arrow_forward</span>
                          <span className="transform-label">{modeDetails.name}</span>
                        </div>

                        <Panel
                          variant="output"
                          title="Generated Result"
                          info={outputImage ? 'Complete' : 'Pending'}
                          footer={outputImage ? (
                            <>
                              <button className="image-action-btn">
                                <span className="icon">download</span>
                                Download
                              </button>
                              <button className="image-action-btn">
                                <span className="icon">share</span>
                                Share
                              </button>
                            </>
                          ) : null}
                        >
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
                        </Panel>
                      </>
                    ) : (
                      <>
                        <Panel variant="input" title="Reference Image" info="Required">
                          <div className="image-content">
                            <ImageUploader />
                          </div>
                        </Panel>
                      </>
                    )}
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

            {/* Footer Drawer: collapsed by default with handle */}
            <BoothFooterDrawer
                title="Generation History"
                subtitle={`Recent transformations with ${modeDetails.name}`}
            >
                {/* This would be populated with actual history once we add that feature */}
                <div className="history-placeholder">
                    <span className="icon">history</span>
                    <p>Your generated images will appear here</p>
                    <small>Start generating to build your transformation history</small>
                </div>
            </BoothFooterDrawer>
        </div>
    );
}

function BoothFooterDrawer({ title, subtitle, children }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                className={`booth-footer-handle ${open ? 'open' : ''}`}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                title={open ? 'Hide panel' : 'Show panel'}
            >
                <span className="icon">{open ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
            </button>
            <div className={`booth-footer-drawer ${open ? 'open' : 'collapsed'}`} role="region" aria-label={title}>
                <div className="history-header">
                    <h3>{title}</h3>
                    {subtitle && <span className="history-count">{subtitle}</span>}
                </div>
                <div className="history-scroll">
                    {children}
                </div>
            </div>
        </>
    );
}
