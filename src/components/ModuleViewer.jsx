/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { personalities } from '../lib/assistant/personalities';
import { modules } from '../lib/modules';
import { toggleAssistant } from '../lib/actions';

export default function ModuleViewer() {
    const activeModuleId = useStore.use.activeModuleId();

    if (!activeModuleId) {
        return null;
    }

    const module = modules[activeModuleId];
    const personality = personalities[activeModuleId];

    return (
        <div className="module-viewer">
            <div className="module-viewer-header">
                <div className="module-viewer-title">
                    <h2>{personality.name}</h2>
                    <p>{module['Module Code']} - {personality.title}</p>
                </div>
                <div className="module-connectors">
                    <button className="icon-btn" title="Figma"><span className="icon">design_services</span></button>
                    <button className="icon-btn" title="GitHub"><span className="icon">code</span></button>
                    <button className="icon-btn" title="Notion"><span className="icon">article</span></button>
                    <button className="icon-btn" title="Google Drive"><span className="icon">folder_open</span></button>
                    <button className="icon-btn" title="Documentation"><span className="icon">description</span></button>
                    <button 
                        className="icon-btn assistant-chat-icon" 
                        onClick={toggleAssistant} 
                        title={`Chat with ${personality.name}`}
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
        </div>
    );
}