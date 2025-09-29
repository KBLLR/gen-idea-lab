/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { personalities } from '../lib/assistant/personalities';
import { toggleAssistant, updateModuleResourceUrl } from '../lib/actions';
import ModuleKnowledgeSection from './ModuleKnowledgeSection';
import c from 'clsx';

// Official brand icons via react-icons (Simple Icons set)
import { SiFigma, SiGithub, SiNotion, SiGoogledrive } from 'react-icons/si';

const resourceIcons = {
    figma: SiFigma,
    github: SiGithub,
    notion: SiNotion,
    googledrive: SiGoogledrive,
};

export default function ModuleViewer() {
    const activeModuleId = useStore.use.activeModuleId();
    const modules = useStore.use.modules();
    const showKnowledgeSection = useStore.use.showKnowledgeSection();
    const actions = useStore.use.actions();

    if (!activeModuleId) {
        return null;
    }

    const module = modules[activeModuleId];
    const personality = personalities[activeModuleId];

    const handleResourceClick = (resourceType, currentUrl) => {
        const newUrl = prompt(`Enter the URL for ${resourceType}:`, currentUrl);
        if (newUrl !== null) {
            updateModuleResourceUrl(activeModuleId, resourceType, newUrl);
        }
    };

    return (
        <div className="module-viewer">
            <div className="module-viewer-header">
                <div className="module-viewer-title">
                    <h2>{personality.name}</h2>
                    <p>{module['Module Code']} - {personality.title}</p>
                </div>
                <div className="module-connectors">
                    {module.resources.map(resource => {
                        const Icon = resourceIcons[resource.type];
                        const hasUrl = resource.url && resource.url.trim() !== '';
                        return (
                            <button 
                                key={resource.type}
                                className={c('icon-btn', { 'has-url': hasUrl })}
                                title={resource.type} 
                                aria-label={resource.type}
                                onClick={() => handleResourceClick(resource.type, resource.url)}
                            >
                                <Icon size={20} />
                            </button>
                        );
                    })}
                    <button className="icon-btn" title="Documentation" aria-label="Documentation"><span className="icon">description</span></button>
                    <button
                        className={c('icon-btn', { 'active': showKnowledgeSection })}
                        onClick={() => actions.toggleKnowledgeSection()}
                        title="Module Knowledge Base"
                        aria-label="Module Knowledge Base"
                    >
                        <span className="icon">library_books</span>
                    </button>
                    <button
                        className="icon-btn assistant-chat-icon"
                        onClick={toggleAssistant}
                        title={`Chat with ${personality.name}`}
                        aria-label={`Chat with ${personality.name}`}
                    >
                        <span className="icon">chat</span>
                    </button>
                </div>
            </div>
            <div className="module-viewer-content">
                <div>
                    <h3>Key Contents & Topics</h3>
                    <p>{module['Key Contents / Topics']}</p>
                </div>
                <div>
                    <h3>Qualification Objectives</h3>
                    <ul>
                        {module['Qualification Objectives'].map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                </div>
            </div>

            {/* Knowledge Section */}
            {showKnowledgeSection && (
                <div className="module-knowledge-wrapper">
                    <ModuleKnowledgeSection moduleId={activeModuleId} />
                </div>
            )}
        </div>
    );
}