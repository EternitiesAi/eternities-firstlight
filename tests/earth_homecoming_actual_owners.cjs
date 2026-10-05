/* Load actual installed files. No module overlay, validator, roster or AI facade. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const load=name=>require(path.join(ROOT,'src',name));
const read=name=>fs.readFileSync(path.join(ROOT,'src',name),'utf8');
module.exports={ROOT,C:load('core.js'),load,read,preimage:false};
