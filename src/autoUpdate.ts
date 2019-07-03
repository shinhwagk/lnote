import * as https from 'https';
import { version } from '../package.json';

export function getTags() {
    return new Promise<string>((resolve, reject) => {
        let body = '';
        https.get(
            'https://api.github.com/repos/shinhwagk/vscode-note/tags',
            {
                headers: { 'User-Agent': 'Awesome-Octocat-App' }
            },
            res => {
                res.on('data', data => body += data);
                res.on('end', () => resolve(body));
                res.on('error', err => reject(err.message));
            }
        );
    });
}

interface GithubTag {
    name: string;
}

export async function checkNewVersion() {
    const str = await getTags();
    const tags: GithubTag[] = JSON.parse(str);
    const latestVersion = tags[0].name.substr(1);
    return version !== latestVersion;
}
