'use strict';
// Exercise the actual installed app functions, not a second test-only copy.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=()=>{const text=fs.readFileSync(path.resolve(__dirname,'../../src/app.js'),'utf8'),start=text.indexOf('// Parent app owns this transient lease independently from the fitting lease.'),end=text.indexOf('let fieldcraftOwner=null,fieldcraftFrame=null;',start);assert.ok(start>=0&&end>start);assert.equal(text.indexOf('let consignmentOwner=null;',start+1),text.lastIndexOf('let consignmentOwner=null;'));return text.slice(start,end);};
