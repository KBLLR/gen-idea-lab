/**
 * @file CharacterLabHeader - Header actions for character rigging
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { ActionBar } from '@ui';
import useStore from '@store';
import { handleAsyncError } from '@shared/lib/errorHandler.js';

const CharacterLabHeader = ({ showGallery, onToggleGallery }) => {
  const actions = useStore.use.actions();
  const pollAllTasks = useStore.use.pollAllTasks();

  const handleNewUpload = () => {
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
      uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      uploadZone.focus();
    }
  };

  const handleRefreshTasks = async () => {
    try {
      await pollAllTasks();
      console.log('Tasks refreshed successfully');
    } catch (error) {
      handleAsyncError(error, {
        context: 'Refreshing rigging tasks',
        showToast: true,
        fallbackMessage: 'Failed to refresh tasks. Please try again.'
      });
    }
  };

  const handleOpenDocs = () => {
    window.open('https://docs.meshy.ai/en/api/rigging-and-animation', '_blank');
  };

  return (
    <BoothHeader
      icon="accessibility_new"
      title="CharacterLab"
      typeText="3D Character Auto-Rigging"
      status="ready"
      description="Upload humanoid .glb models and automatically add bones and animations using Meshy AI. Track progress in the sidebar."
      align="top"
      actions={
        <ActionBar
          separators
          items={[
            { id: 'upload', icon: 'upload_file', label: 'New Upload', onClick: handleNewUpload },
            { id: 'gallery', icon: 'collections', label: showGallery ? 'Hide Gallery' : 'Show Gallery', onClick: onToggleGallery },
            { id: 'refresh', icon: 'refresh', label: 'Refresh Tasks', onClick: handleRefreshTasks },
            { id: 'docs', icon: 'menu_book', label: 'API Docs', onClick: handleOpenDocs },
          ]}
          aria-label="CharacterLab actions"
        />
      }
    />
  );
};

export default CharacterLabHeader;
