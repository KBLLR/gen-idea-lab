/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../lib/store';
import { personalities } from '../lib/assistant/personalities';

import ModuleKnowledgeSection from './ModuleKnowledgeSection';
import ActionBar from './ui/ActionBar.jsx';
import c from 'clsx';

// Official brand icons via react-icons (Simple Icons set)
import { SiFigma, SiGithub, SiNotion, SiGoogledrive } from 'react-icons/si';

const resourceIcons = {
    figma: SiFigma,
    github: SiGithub,
    notion: SiNotion,
    googledrive: SiGoogledrive,
};

// Discipline-specific content for center column
const disciplineContent = {
    'DS': {
        title: 'Human-Computer Design (DS)',
        description: 'Focuses on visual communication, user experience, and the intersection of human needs with technological possibilities.',
        keyTopics: [
            'UI', 'UX', 'AR/VR', 'HCI', 'Prototyping', 'Design Research',
            'Creative Tech', 'Brand Design', 'Animation', 'Video Production',
            'Physical Interfaces', 'Generative Design', 'Typography', 'Photography'
        ],
        applications: [
            'UI/UX Design for Digital Products',
            'Brand Identity & Visual Communication',
            'Interactive Installations & Physical Interfaces',
            'Design Research for Innovation',
            'Creative Technology & Generative Art'
        ]
    },
    'SE': {
        title: 'Software Engineering (SE)',
        description: 'Covers programming fundamentals, web technologies, and technical implementation of digital solutions.',
        keyTopics: [
            'JavaScript', 'Python', 'React', 'Node.js', 'APIs', 'Databases',
            'HTML/CSS', 'Git', 'Algorithms', 'Data Structures', 'Testing',
            'DevOps', 'Cloud', '3D Printing', 'Arduino', 'Web Dev'
        ],
        applications: [
            'Full-Stack Web Application Development',
            'API Design & Backend Services',
            'Digital Prototyping & Manufacturing',
            'Algorithm Design & Optimization',
            'DevOps & Cloud Deployment'
        ]
    },
    'STS': {
        title: 'Science, Technology and Society (STS)',
        description: 'Examines the social, ethical, and cultural implications of technology in contemporary society.',
        keyTopics: [
            'AI Ethics', 'Tech Policy', 'Digital Society', 'Sustainability',
            'Research Methods', 'Academic Writing', 'Philosophy', 'Critical Thinking',
            'Public Speaking', 'Tech Criticism', 'Social Impact', 'Future Studies'
        ],
        applications: [
            'Technology Ethics & Policy Research',
            'Academic Research & Publication',
            'Sustainability Consulting & Strategy',
            'Public Speaking & Presentation',
            'Critical Technology Assessment'
        ]
    },
    'BA': {
        title: 'Synthesis (BA)',
        description: 'Integrates knowledge from all disciplines in capstone projects and independent research.',
        keyTopics: [
            'Capstone Project', 'Thesis Writing', 'Research', 'Project Management',
            'Portfolio', 'Team Leadership', 'Interdisciplinary', 'Innovation',
            'Industry Integration', 'Problem Solving', 'Academic Writing'
        ],
        applications: [
            'Capstone Project Leadership',
            'Bachelor Thesis Research',
            'Industry-Academic Collaboration',
            'Portfolio-Based Career Development',
            'Independent Consulting & Entrepreneurship'
        ]
    }
};

export default function ModuleViewer() {
    const activeModuleId = useStore.use.activeModuleId();
    const modules = useStore.use.modules();
    const showKnowledgeSection = useStore.use.showKnowledgeSection();
    const connectedServices = useStore.use.connectedServices();
    const actions = useStore.use.actions();

    if (!activeModuleId) {
        return null;
    }

    const module = modules[activeModuleId];
    const personality = personalities[activeModuleId];

    // Determine discipline from module code
    let disciplineKey = 'DS'; // default
    if (activeModuleId.startsWith('SE_')) disciplineKey = 'SE';
    else if (activeModuleId.startsWith('STS_')) disciplineKey = 'STS';
    else if (activeModuleId.startsWith('BA_')) disciplineKey = 'BA';

    const disciplineInfo = disciplineContent[disciplineKey];

    

    return (
        <div className="module-viewer">
            <div className="module-viewer-header">
                <div className="module-viewer-title">
                    <h2>{personality.name}</h2>
                    <p>{module['Module Code']} - {personality.title}</p>
                </div>
                <div className="module-connectors">
                    {(() => {
                        const items = [];
                        module.resources.forEach((resource) => {
                            const Icon = resourceIcons[resource.type];
                            const isConnected = !!(connectedServices?.[resource.type]?.connected);
                            items.push({
                                key: `res-${resource.type}`,
                                title: resource.type,
                                content: (
                                  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                    <Icon size={18} />
                                    <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} style={{ position: 'absolute', top: -2, right: -6 }} />
                                  </span>
                                ),
                                onClick: () => {}
                            });
                        });
                        items.push({ key: 'docs', title: 'Documentation', icon: 'description', onClick: () => {} });
                        items.push({ key: 'kb', title: 'Knowledge', icon: 'database', onClick: () => actions.toggleKnowledgeSection(), ariaPressed: !!showKnowledgeSection });
                        items.push({ key: 'chat', title: 'Chat', icon: 'chat', onClick: () => actions.setActiveApp('chat') });
                        return <ActionBar items={items} showDividers={true} ariaLabel="Module actions" />;
                    })()}
                </div>
            </div>
            <div className="module-viewer-content">
                <div className="module-info-row">
                    <div className="module-info-item">
                        <span className="icon">school</span>
                        <strong>{module['ECTS Credits']}</strong>
                    </div>
                    <div className="module-info-item">
                        <span className="icon">schedule</span>
                        <strong>{module['Contact Time (hours)']}</strong>
                    </div>
                    <div className="module-info-item">
                        <span className="icon">label</span>
                        <strong>{module['Module Type']}</strong>
                    </div>
                    <div className="module-info-item">
                        <span className="icon">person</span>
                        <strong>{module['Module Coordinator']}</strong>
                    </div>
                </div>
                <div>
                    <h3>Key Focus Areas</h3>
                    <div className="topic-tags">
                        {disciplineInfo.keyTopics.map((topic, i) => (
                            <span key={i} className="topic-tag">{topic}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3>Professional Applications</h3>
                    <ul>
                        {disciplineInfo.applications.map((app, i) => <li key={i}>{app}</li>)}
                    </ul>
                </div>
                <div>
                    <h3>This Module: {module['Module Title']}</h3>
                    <p><strong>Key Contents:</strong> {module['Key Contents / Topics']}</p>
                </div>
                <div>
                    <h3>Learning Objectives</h3>
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
