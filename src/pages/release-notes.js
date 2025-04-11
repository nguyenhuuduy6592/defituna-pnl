import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import styles from '@/styles/ReleaseNotes.module.scss';
import { appTitle } from '@/utils';

function ReleaseNotesPage({ notes }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Release Notes - {appTitle}</title>
        <meta name="description" content="View version history and latest updates for DeFiTuna PnL Viewer" />
      </Head>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Release Notes</h1>
            <p className={styles.subtitle}>View version history and updates for DeFiTuna</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/" className={styles.backLink}>
              ← Back to PnL Viewer
            </Link>
          </div>
        </div>

        {notes.length === 0 && <p>No release notes available yet.</p>}
        {notes.map(({ version, content }) => (
          <div key={version} className={styles.noteItem}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ))}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const notesDir = path.join(process.cwd(), 'public', 'release-notes');
  let notes = [];

  try {
    if (!fs.existsSync(notesDir)) {
      console.warn("Release notes directory 'public/release-notes' does not exist.");
    } else {
      const filenames = fs.readdirSync(notesDir);
      notes = filenames
        .filter(filename => filename.endsWith('.md'))
        .map((filename) => {
          const version = filename.replace('.md', '');
          const filePath = path.join(notesDir, filename);
          const content = fs.readFileSync(filePath, 'utf8');
          return { version, content };
        })
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
    }
  } catch (error) {
    console.error("Error reading release notes directory or files:", error);
  }

  return {
    props: { notes },
    revalidate: 600 // Re-generate page at most once every 600 seconds
  };
}

export default ReleaseNotesPage;
