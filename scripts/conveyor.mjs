import { readFile, writeFile } from 'node:fs/promises';
const root = '.';
const names = ['python','javascript','cplusplus','c','lua','java','git','vscode','jupyter','robloxstudio'];
const icons = await Promise.all(names.map(async name => ({name, source: await readFile(`assets/icons/${name}.svg`, 'utf8')})));
let group='';
for (let repeat=0;repeat<2;repeat++) {
  icons.forEach(({name,source},i) => {
    const viewBox=source.match(/viewBox="([^"]+)"/i)?.[1];
    if (!viewBox) throw new Error(`No viewBox for ${name}`);
    let body=source.replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
    // Namespace IDs so repeated vendor icons keep their own gradients and masks.
    body=body.replace(/id="([^"]+)"/g,`id="${name}-${repeat}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#${name}-${repeat}-$1)`);
    group+=`<svg x="${24+(repeat*10+i)*96}" y="28" width="48" height="48" viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
  });
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="104" viewBox="0 0 960 104" role="img" aria-labelledby="title desc">
<title id="title">Languages and tools</title><desc id="desc">Python, JavaScript, C++, C, Lua, Java, Git, VS Code, Jupyter Notebook, and Roblox Studio.</desc>
<style>.belt{animation:conveyor 36s linear infinite} @keyframes conveyor{to{transform:translateX(-960px)}} @media(prefers-reduced-motion:reduce){.belt{animation:none}}</style>
<defs><clipPath id="window"><rect width="960" height="104" rx="16"/></clipPath></defs>
<rect width="960" height="104" rx="16" fill="#f5f0fa"/>
<g clip-path="url(#window)"><g class="belt" fill="#58356f">${group}</g></g>
</svg>\n`;
await writeFile(`${root}/assets/tools-conveyor.svg`,svg);

