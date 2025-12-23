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

async function createOrUpdateFile(octokit: Octokit, owner: string, repo: string, filePath: string, content: string, message: string) {
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if ('sha' in data) sha = data.sha;
  } catch (e: any) {}
  
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filePath, message,
    content: Buffer.from(content).toString('base64'),
    sha
  });
  console.log(`  ${sha ? 'Updated' : 'Created'}: ${filePath}`);
}

async function deleteFileIfExists(octokit: Octokit, owner: string, repo: string, filePath: string) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if ('sha' in data) {
      await octokit.repos.deleteFile({
        owner, repo, path: filePath,
        message: `Remove ${filePath}`,
        sha: data.sha
      });
      console.log(`  Deleted: ${filePath}`);
    }
  } catch (e: any) {}
}

async function main() {
  const repoName = 'blog-editor';
  
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  console.log('\\nPushing new files...');
  const content = fs.readFileSync('api/index.ts', 'utf-8');
  await createOrUpdateFile(octokit, user.login, repoName, 'api/index.ts', content, 'Single API handler - no external imports');
  
  const vercelContent = fs.readFileSync('vercel.json', 'utf-8');
  await createOrUpdateFile(octokit, user.login, repoName, 'vercel.json', vercelContent, 'Route all /api/* to single handler');
  
  console.log('\\nRemoving old files...');
  await deleteFileIfExists(octokit, user.login, repoName, 'api/posts/index.ts');
  await deleteFileIfExists(octokit, user.login, repoName, 'api/posts/[id].ts');
  
  console.log('\\nDone! Try deploying again.');
}

main().catch(console.error);
