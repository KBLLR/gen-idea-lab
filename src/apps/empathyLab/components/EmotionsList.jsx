/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export default function EmotionsList({ humanEmotions = [], humeEmotions = [] }) {
    // Sort emotions by score
    const sortedHumanEmotions = [...humanEmotions]
        .sort((a, b) => b.score - a.score);

    const sortedHumeEmotions = [...humeEmotions]
        .sort((a, b) => b.score - a.score);

    return (
        <div className="emotions-list">
            {/* Human Emotions Section */}
            <div className="emotion-section">
                <div className="emotion-section-header">
                    <span className="icon">face</span>
                    <h3>Human (Face)</h3>
                </div>
                <div className="emotion-items">
                    {sortedHumanEmotions.length === 0 ? (
                        <div className="emotions-empty">
                            <p>No face emotions detected</p>
                        </div>
                    ) : (
                        sortedHumanEmotions.map((emotion, index) => (
                            <div key={`human-${emotion.emotion}-${index}`} className="emotion-item">
                                <div className="emotion-info">
                                    <span className="emotion-name">{emotion.emotion}</span>
                                    <span className="emotion-score">{Math.round(emotion.score * 100)}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div
                                        className="emotion-bar"
                                        style={{
                                            width: `${emotion.score * 100}%`,
                                            background: getEmotionColor(emotion.emotion)
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Hume Emotions Section */}
            <div className="emotion-section">
                <div className="emotion-section-header">
                    <span className="icon">mic</span>
                    <h3>Hume (Voice)</h3>
                </div>
                <div className="emotion-items">
                    {sortedHumeEmotions.length === 0 ? (
                        <div className="emotions-empty">
                            <p>No voice emotions detected</p>
                        </div>
                    ) : (
                        sortedHumeEmotions.map((emotion, index) => (
                            <div key={`hume-${emotion.name}-${index}`} className="emotion-item">
                                <div className="emotion-info">
                                    <span className="emotion-name">{emotion.name}</span>
                                    <span className="emotion-score">{Math.round(emotion.score * 100)}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div
                                        className="emotion-bar"
                                        style={{
                                            width: `${emotion.score * 100}%`,
                                            background: getEmotionColor(emotion.name)
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function getEmotionColor(emotion) {
    const colors = {
        happy: '#4CAF50',
        joy: '#4CAF50',
        sad: '#2196F3',
        angry: '#F44336',
        surprise: '#FF9800',
        excitement: '#FF9800',
        fear: '#9C27B0',
        anxiety: '#9C27B0',
        disgust: '#795548',
        contempt: '#795548',
        neutral: '#9E9E9E',
        love: '#E91E63',
        confusion: '#607D8B'
    };
    return colors[emotion?.toLowerCase()] || 'var(--color-accent)';
}
