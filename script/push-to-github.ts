// Script to push the blog editor to GitHub
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Files and directories to include
const includeDirs = ['client', 'server', 'shared', 'script'];
const includeFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'drizzle.config.ts',
  'components.json',
  'design_guidelines.md'
];

// Files/patterns to exclude
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.config',
  'push-to-github.ts',
  'favicon.png'
];

function shouldExclude(filePath: string): boolean {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
    
    if (shouldExclude(fullPath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else if (entry.isFile()) {
      // Skip binary files
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
        continue;
      }
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ path: relativePath, content });
      } catch (e) {
        console.log(`Skipping binary or unreadable file: ${relativePath}`);
      }
    }
  }
  
  return files;
}

async function initializeEmptyRepo(octokit: Octokit, owner: string, repo: string) {
  console.log('Initializing empty repository...');
  
  // Create an initial README to initialize the repo
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'README.md',
    message: 'Initial commit',
    content: Buffer.from('# Blog Editor\n\nInitializing...').toString('base64')
  });
  
  // Wait for GitHub to process
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('Repository initialized');
}

async function main() {
  const repoName = process.argv[2] || 'blog-editor';
  
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Check if repo exists
  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating new repository: ${repoName}`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Self-hostable blog editor with TUI markdown editor and Supabase storage',
        private: false,
        auto_init: true
      });
      console.log(`Repository created: https://github.com/${user.login}/${repoName}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw e;
    }
  }
  
  // Check if repo has commits (main branch exists)
  let hasCommits = false;
  try {
    await octokit.git.getRef({ owner: user.login, repo: repoName, ref: 'heads/main' });
    hasCommits = true;
  } catch (e: any) {
    if (e.status === 409 || e.status === 404) {
      // Empty repo - need to initialize
      await initializeEmptyRepo(octokit, user.login, repoName);
    } else {
      throw e;
    }
  }
  
  // Collect all files
  console.log('Collecting files...');
  const allFiles: { path: string; content: string }[] = [];
  
  // Add directories
  for (const dir of includeDirs) {
    allFiles.push(...getAllFiles(dir, dir));
  }
  
  // Add root files
  for (const file of includeFiles) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        allFiles.push({ path: file, content });
      } catch (e) {
        console.log(`Skipping: ${file}`);
      }
    }
  }
  
  // Add README
  const readmeContent = `# Blog Editor

A self-hostable blog application built with React, Express, and the TUI Markdown Editor.

## Features

- Create, edit, and view blog posts
- TUI Editor with markdown and WYSIWYG modes
- Live preview while editing
- Dark mode support
- Supabase for data persistence

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project

### Supabase Setup

1. Create a new Supabase project
2. Run the following SQL in the SQL Editor:

\`\`\`sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on posts" ON posts
  FOR ALL USING (true) WITH CHECK (true);
\`\`\`

### Environment Variables

Create a \`.env\` file with:

\`\`\`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Deployment

This app can be deployed to any Node.js hosting platform:
- Replit
- Vercel (with serverless functions)
- Railway
- Render
- DigitalOcean App Platform

## License

MIT
`;
  
  allFiles.push({ path: 'README.md', content: readmeContent });
  
  // Add .gitignore
  const gitignoreContent = `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`;
  allFiles.push({ path: '.gitignore', content: gitignoreContent });
  
  console.log(`Found ${allFiles.length} files to upload`);
  
  // Get current ref
  const { data: ref } = await octokit.git.getRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main'
  });
  
  const { data: latestCommit } = await octokit.git.getCommit({
    owner: user.login,
    repo: repoName,
    commit_sha: ref.object.sha
  });
  
  // Create blobs in batches to avoid rate limiting
  console.log('Creating file blobs...');
  const blobs: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  const batchSize = 10;
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: user.login,
          repo: repoName,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha
        };
      })
    );
    blobs.push(...batchResults);
    console.log(`Uploaded ${Math.min(i + batchSize, allFiles.length)}/${allFiles.length} files`);
  }
  
  // Create tree
  console.log('Creating file tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: blobs,
    base_tree: latestCommit.tree.sha
  });
  
  // Create commit
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: 'Add blog editor with TUI markdown editor and Supabase storage',
    tree: tree.sha,
    parents: [ref.object.sha]
  });
  
  // Update ref
  await octokit.git.updateRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha
  });
  
  console.log('\\n========================================');
  console.log(`Success! Code pushed to GitHub`);
  console.log(`Repository: https://github.com/${user.login}/${repoName}`);
  console.log('========================================');
}

main().catch(console.error);
