// src/components/AppVersionDisplay.js
import React from 'react';
import Link from 'next/link';
import styles from '@/styles/AppVersion.module.scss';

function AppVersionDisplay() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  if (!appVersion) {
    return null; 
  }

  return (
    <div className={styles.versionContainer} data-testid="version-container">
      <span className={styles.versionText} data-testid="version-text">
        Version: {appVersion}
      </span>
      <Link href="/release-notes" className={styles.releaseNotesLink} data-testid="release-notes-link">
        (Release Notes)
      </Link>
    </div>
  );
}

export default AppVersionDisplay;