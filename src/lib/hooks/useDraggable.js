/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export const useDraggable = (initialPosition = { x: 0, y: 0 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState(initialPosition);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left mouse button
        
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos(position);
        
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        setPosition({
            x: initialPos.x + deltaX,
            y: initialPos.y + deltaY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, dragStart, initialPos]);

    return {
        isDragging,
        position,
        setPosition,
        handleMouseDown
    };
};