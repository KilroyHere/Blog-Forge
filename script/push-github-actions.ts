import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

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

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  );
  
  const data = await response.json();
  connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createOrUpdateFile(octokit: Octokit, owner: string, repo: string, path: string, content: string, message: string) {
  let sha: string | undefined;
  
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ('sha' in data) {
      sha = data.sha;
    }
  } catch (e: any) {
    // File doesn't exist
  }
  
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha
  });
  
  console.log(`  ${sha ? 'Updated' : 'Created'}: ${path}`);
}

async function main() {
  const repoName = 'blog-editor';
  
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Files to push (excluding workflow files which need special permissions)
  const files = [
    { path: 'vercel.json', localPath: 'vercel.json' },
    { path: 'api/posts/index.ts', localPath: 'api/posts/index.ts' },
    { path: 'api/posts/[id].ts', localPath: 'api/posts/[id].ts' }
  ];
  
  console.log('Uploading files...');
  for (const file of files) {
    const content = fs.readFileSync(file.localPath, 'utf-8');
    await createOrUpdateFile(
      octokit, 
      user.login, 
      repoName, 
      file.path, 
      content,
      `Update ${file.path} for Vercel deployment`
    );
  }
  
  console.log('\\n========================================');
  console.log('Deployment files pushed to GitHub!');
  console.log(`Repository: https://github.com/${user.login}/${repoName}`);
  console.log('\\nNOTE: You need to manually add .github/workflows/deploy.yml');
  console.log('See instructions below.');
  console.log('========================================');
}

main().catch(console.error);
