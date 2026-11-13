/* Player-visible text guard. Scans string literals and markup in every src module; comments and identifiers are skipped.
 * Shell-owned files must stay clean (a hard failure). Hits in other lanes' files are reported with file:line for their owners. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const SRC=path.join(__dirname,'../src');
const BANNED=[
 ['prototype',/(?<![.\w])prototype\b/i],['provisional',/\bprovisional\b/i],['epoch',/\bepoch\b/i],['realm 10',/\brealm 10\b/i],
 ['luna',/\bluna\b/i],['not a claim',/not a claim/i],['fixture',/\bfixtures?\b/i],['harness',/\bharness\b/i],['fee',/\bfees?\b/i]
];
const SHELL_OWNED=['app.js','rpg-ui.js','realm-atlas-ui.js','title.js','pause.js','credits.js','first-run.js','shell.html'];
// string and template literal contents with their starting line; comments and regex literals are skipped.
function literals(src){
 const out=[];let i=0,line=1,last='';const n=src.length;
 while(i<n){
  const c=src[i],d=src[i+1];
  if(c==='\n'){line++;i++;continue;}
  if(c===' '||c==='\t'||c==='\r'){i++;continue;}
  if(c==='/'&&d==='/'){while(i<n&&src[i]!=='\n')i++;last='';continue;}
  if(c==='/'&&d==='*'){const e=src.indexOf('*/',i+2),stop=e<0?n:e+2;for(let k=i;k<stop;k++)if(src[k]==='\n')line++;i=stop;last='';continue;}
  if(c==='"'||c==="'"||c==='`'){
   const start=line;let j=i+1,buf='';
   while(j<n&&src[j]!==c){
    if(src[j]==='\\'){buf+=src[j]+(src[j+1]||'');if(src[j+1]==='\n')line++;j+=2;continue;}
    if(src[j]==='\n')line++;
    buf+=src[j];j++;
   }
   out.push({line:start,text:buf});i=j+1;last='"';continue;
  }
  if(c==='/'&&!/[\w)\]]/.test(last)){
   let j=i+1,cls=false;
   while(j<n&&src[j]!=='\n'){
    const ch=src[j];
    if(ch==='\\'){j+=2;continue;}
    if(ch==='[')cls=true;else if(ch===']')cls=false;else if(ch==='/'&&!cls)break;
    j++;
   }
   i=j+1;last='"';continue;
  }
  last=c;i++;
 }
 return out;
}
function hits(file,items){
 const out=[];
 for(const {line,text} of items)for(const [name,re] of BANNED)if(re.test(text))out.push({file,line,token:name,text:text.trim().slice(0,110)});
 return out;
}
function scan(file){
 const text=fs.readFileSync(path.join(SRC,file),'utf8');
 if(file.endsWith('.html'))return hits(file,text.split('\n').map((t,k)=>({line:k+1,text:t})));
 return hits(file,literals(text));
}
const files=fs.readdirSync(SRC).filter(f=>/\.(js|html)$/.test(f));
test('the player text scan covers every source module',()=>{
 assert.ok(files.length>=150,'only '+files.length+' sources scanned');
 assert.ok(files.includes('shell.html')&&files.includes('epilogue-data.js')&&files.includes('night.js')&&files.includes('nearshore.js'));
});
test('shell-owned player text has no developer or compliance words',()=>{
 const found=SHELL_OWNED.flatMap(f=>files.includes(f)?scan(f):[]);
 assert.deepEqual(found,[],found.map(h=>h.file+':'+h.line+' '+h.token+' | '+h.text).join('\n'));
});
test('other lanes hits are reported for their owners, file:line',t=>{
 const found=files.filter(f=>!SHELL_OWNED.includes(f)).flatMap(scan);
 const byToken={};for(const h of found)byToken[h.token]=(byToken[h.token]||0)+1;
 t.diagnostic('hits outside shell-owned files: '+found.length+' '+JSON.stringify(byToken));
 for(const h of found)t.diagnostic(h.file+':'+h.line+' '+h.token+' | '+h.text);
});
