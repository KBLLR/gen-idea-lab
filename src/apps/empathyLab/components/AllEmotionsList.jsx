/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';

// Color mapping from empathic-ai/utils/expressionColors.ts
const EMOTION_COLORS = {
    'Admiration': '#ffc58f',
    'Adoration': '#ffc6cc',
    'Aesthetic Appreciation': '#e2cbff',
    'Amusement': '#febf52',
    'Anger': '#b21816',
    'Annoyance': '#ffffff',
    'Anxiety': '#6e42cc',
    'Awe': '#7dabd3',
    'Awkwardness': '#d7d99d',
    'Boredom': '#a4a4a4',
    'Calmness': '#a9cce1',
    'Concentration': '#336cff',
    'Contemplation': '#b0aeef',
    'Confusion': '#c66a26',
    'Contempt': '#76842d',
    'Contentment': '#e5c6b4',
    'Craving': '#54591c',
    'Determination': '#ff5c00',
    'Disappointment': '#006c7c',
    'Disapproval': '#ffffff',
    'Disgust': '#1a7a41',
    'Distress': '#c5f264',
    'Doubt': '#998644',
    'Ecstasy': '#ff48a4',
    'Embarrassment': '#63c653',
    'Empathic Pain': '#ca5555',
    'Enthusiasm': '#ffffff',
    'Entrancement': '#7554d6',
    'Envy': '#1d4921',
    'Excitement': '#fff974',
    'Fear': '#d1c9ef',
    'Gratitude': '#ffffff',
    'Guilt': '#879aa1',
    'Horror': '#772e7a',
    'Interest': '#a9cce1',
    'Joy': '#ffd600',
    'Love': '#f44f4c',
    'Nostalgia': '#b087a1',
    'Pain': '#8c1d1d',
    'Pride': '#9a4cb6',
    'Realization': '#217aa8',
    'Relief': '#fe927a',
    'Romance': '#f0cc86',
    'Sadness': '#305575',
    'Sarcasm': '#ffffff',
    'Satisfaction': '#a6ddaf',
    'Sexual Desire': '#aa0d59',
    'Shame': '#8a6262',
    'Surprise': '#70e63a',
    'Surprise (Negative)': '#70e63a',
    'Surprise (Positive)': '#7affff',
    'Sympathy': '#7f88e0',
    'Tiredness': '#757575',
    'Triumph': '#ec8132'
};

// Icon mapping for emotions
const EMOTION_ICONS = {
    'Admiration': 'star',
    'Adoration': 'favorite',
    'Aesthetic Appreciation': 'palette',
    'Amusement': 'mood',
    'Anger': 'whatshot',
    'Annoyance': 'sentiment_dissatisfied',
    'Anxiety': 'psychology',
    'Awe': 'auto_awesome',
    'Awkwardness': 'sentiment_neutral',
    'Boredom': 'bedtime',
    'Calmness': 'spa',
    'Concentration': 'visibility',
    'Contemplation': 'lightbulb',
    'Confusion': 'help',
    'Contempt': 'thumb_down',
    'Contentment': 'sentiment_satisfied',
    'Craving': 'restaurant',
    'Determination': 'bolt',
    'Disappointment': 'trending_down',
    'Disapproval': 'block',
    'Disgust': 'sick',
    'Distress': 'warning',
    'Doubt': 'contact_support',
    'Ecstasy': 'celebration',
    'Embarrassment': 'face',
    'Empathic Pain': 'healing',
    'Enthusiasm': 'emoji_events',
    'Entrancement': 'remove_red_eye',
    'Envy': 'visibility_off',
    'Excitement': 'fireplace',
    'Fear': 'sentiment_very_dissatisfied',
    'Gratitude': 'volunteer_activism',
    'Guilt': 'error',
    'Horror': 'bug_report',
    'Interest': 'search',
    'Joy': 'sentiment_very_satisfied',
    'Love': 'favorite_border',
    'Nostalgia': 'history',
    'Pain': 'local_hospital',
    'Pride': 'military_tech',
    'Realization': 'tips_and_updates',
    'Relief': 'check_circle',
    'Romance': 'favorite',
    'Sadness': 'sentiment_sad',
    'Sarcasm': 'chat_bubble',
    'Satisfaction': 'done_all',
    'Sexual Desire': 'favorite',
    'Shame': 'hide_source',
    'Surprise': 'new_releases',
    'Surprise (Negative)': 'priority_high',
    'Surprise (Positive)': 'stars',
    'Sympathy': 'psychology',
    'Tiredness': 'snooze',
    'Triumph': 'emoji_events'
};

// All 52 Hume emotions (comprehensive list)
const ALL_HUME_EMOTIONS = Object.keys(EMOTION_COLORS);

export default function AllEmotionsList({ humeEmotions = {} }) {
    // Create complete emotion list with scores
    const allEmotions = useMemo(() => {
        return ALL_HUME_EMOTIONS.map(name => ({
            name,
            score: humeEmotions[name] || 0
        }))
        // Sort by score descending (active emotions at top)
        .sort((a, b) => b.score - a.score);
    }, [humeEmotions]);

    return (
        <div className="all-emotions-list" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--color-surface-border)',
                background: 'var(--color-surface)'
            }}>
                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span className="icon">psychology</span>
                    <span>Voice Emotions (Hume)</span>
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.25rem'
                }}>
                    {Object.keys(humeEmotions).length > 0
                        ? `${allEmotions.filter(e => e.score > 0).length} active emotions`
                        : 'Start voice chat to see emotions'}
                </div>
            </div>

            {/* Scrollable emotion list */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0.5rem'
            }}>
                {allEmotions.map((emotion, index) => {
                    const isActive = emotion.score > 0.1;
                    const opacity = emotion.score > 0 ? 0.3 + (emotion.score * 0.7) : 0.3;
                    const emotionColor = EMOTION_COLORS[emotion.name] || '#9E9E9E';
                    const emotionIcon = EMOTION_ICONS[emotion.name] || 'psychology';

                    return (
                        <div
                            key={emotion.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                marginBottom: '0.25rem',
                                background: isActive
                                    ? 'rgba(110, 66, 204, 0.1)'
                                    : 'var(--color-surface)',
                                border: `1px solid ${isActive
                                    ? 'rgba(110, 66, 204, 0.3)'
                                    : 'var(--color-surface-border)'}`,
                                borderRadius: 'var(--radius-md)',
                                transition: 'all 0.3s ease',
                                opacity
                            }}
                        >
                            {/* Emotion icon */}
                            <span
                                className="icon"
                                style={{
                                    fontSize: '1.125rem',
                                    color: emotionColor,
                                    flexShrink: 0
                                }}
                            >
                                {emotionIcon}
                            </span>

                            {/* Emotion name */}
                            <div style={{
                                flex: 1,
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#6e42cc' : 'var(--color-text-primary)',
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {emotion.name}
                            </div>

                            {/* Score percentage */}
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)',
                                minWidth: '2.5rem',
                                textAlign: 'right',
                                fontWeight: 600,
                                flexShrink: 0
                            }}>
                                {emotion.score > 0 ? `${Math.round(emotion.score * 100)}%` : '—'}
                            </div>

                            {/* Circular color indicator */}
                            <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: emotionColor,
                                border: isActive ? `2px solid ${emotionColor}` : '2px solid transparent',
                                boxShadow: isActive ? `0 0 8px ${emotionColor}` : 'none',
                                flexShrink: 0,
                                transition: 'all 0.3s ease'
                            }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
