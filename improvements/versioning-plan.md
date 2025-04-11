# Updated Plan: Version Display & Single Release Notes Page (Next.js - Pages Router)

This plan outlines the steps to:
1.  Display the current application version derived from `package.json`.
2.  Create a *single* page that displays the content of all release notes from markdown files.

---

**1. Version Management & Build Integration**

*   **Source of Truth:** The `version` field in your `package.json` will remain the canonical version number.
*   **Update Workflow:** Use `npm version <patch|minor|major>` command in your terminal before committing release changes. This updates `package.json` and creates a git tag.
*   **Expose Version to Frontend:**
    *   Modify the `build` script in `package.json` to pass the package version as an environment variable during the build. Use `cross-env` for cross-platform compatibility.
    *   First, install `cross-env`:
        ```bash
        npm install --save-dev cross-env
        ```
    *   Then, update the script:
        ```json
        // package.json
        "scripts": {
          // ... other scripts
          "build": "cross-env NEXT_PUBLIC_APP_VERSION=$npm_package_version next build",
          // ... maybe "start", "dev" etc.
        },
        ```
        *(Note: `$npm_package_version` works on Linux/macOS. On Windows cmd, you might need `%npm_package_version%`. `cross-env` helps manage this difference).*

**2. Displaying Current Version in UI**

*   **Create a Display Component:** Create a simple component to show the version.
    *   File: `src/components/AppVersionDisplay.js`
    *   Content:
        ```javascript
        // src/components/AppVersionDisplay.js
        import React from 'react';

        function AppVersionDisplay() {
          const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

          if (!appVersion) {
            return null; // Don't render if version is not set
          }

          return (
            <span style={{ fontSize: '0.8em', color: '#888', marginTop: '1rem' }}>
              Version: {appVersion}
            </span>
          );
        }

        export default AppVersionDisplay;
        ```
*   **Integrate Component:** Add this component to a shared layout or footer component that appears on your pages. If you don't have one, you might add it directly in `src/pages/_app.js` within the main structure.
    *   Example Integration (conceptual, adapt to your structure):
        ```javascript
        // Example: In a Layout component or _app.js
        import AppVersionDisplay from '../components/AppVersionDisplay';

        function MyAppOrLayout({ Component, pageProps }) {
          // ... other layout code
          return (
            <div>
              <main>
                <Component {...pageProps} />
              </main>
              <footer>
                {/* Other footer content */}
                <AppVersionDisplay />
              </footer>
            </div>
          );
        }
        ```

**3. Single Release Notes Page**

*   **Create Content Directory:** Make a new directory: `public/release-notes/`
*   **Add Markdown Files:** Place your release notes here, named by version (e.g., `public/release-notes/v0.1.0.md`, `public/release-notes/v0.2.0.md`).
    *   Example `v0.1.0.md`:
        ```markdown
        # Version 0.1.0 - Initial Release

        - Feature A implemented.
        - Bug fix for issue B.
        ```
*   **Install Markdown Renderer:**
    ```bash
    npm install react-markdown
    ```
*   **Create Single Release Notes Page:**
    *   File: `src/pages/release-notes.js` (Note: not in a sub-directory like `release-notes/index.js`)
    *   Content:
        ```javascript
        // src/pages/release-notes.js
        import React from 'react';
        import fs from 'fs';
        import path from 'path';
        import ReactMarkdown from 'react-markdown';

        function ReleaseNotesPage({ notes }) {
          return (
            <div>
              <h1>Release Notes</h1>
              {notes.length === 0 && <p>No release notes available yet.</p>}
              {notes.map(({ version, content }) => (
                <div key={version} style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  <h2>Version {version.replace(/^v/, '')}</h2>
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ))}
            </div>
          );
        }

        export async function getStaticProps() {
          const notesDir = path.join(process.cwd(), 'public', 'release-notes');
          let notes = [];

          try {
            const filenames = fs.readdirSync(notesDir);
            notes = filenames
              .filter((filename) => filename.endsWith('.md'))
              .map((filename) => {
                const version = filename.replace('.md', '');
                const filePath = path.join(notesDir, filename);
                const content = fs.readFileSync(filePath, 'utf8');
                return { version, content };
              })
              // Sort notes by version descending (newest first)
              .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
          } catch (error) {
             console.error("Could not read release notes directory or files:", error);
             // Handle error appropriately, maybe return empty notes
          }

          return {
            props: {
              notes,
            },
          };
        }

        export default ReleaseNotesPage;
        ```

---
