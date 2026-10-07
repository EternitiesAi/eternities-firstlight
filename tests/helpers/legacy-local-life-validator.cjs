'use strict';
// Frozen historical client parser, evaluated in an isolated namespace only.
// This proves its strict catalogue rejection; it is never installed as runtime.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const bytes=fs.readFileSync(path.resolve(__dirname,'../fixtures/legacy-local-life-99e8.js.fixture'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'005f7bd489bba2832aaec0b6c9d1cc499660e6e0047be73ab0f85d2922955d48');
const scope={module:{exports:{}},console};vm.createContext(scope);vm.runInContext(bytes.toString('utf8'),scope,{filename:'frozen-local-life-99e8'});module.exports=scope.module.exports.validate;
