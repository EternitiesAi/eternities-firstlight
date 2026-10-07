'use strict';
// Frozen independent pre-implementation geography proposal; no production imports.
const assert=require('node:assert/strict');
const point=(id,x,z)=>Object.freeze({id,x,z});
const glade=point('load-glade',-106,-105),bay=point('merren-receiving-bay',5.8,-69);
const ROUTES=Object.freeze({
 'southern-meadow':Object.freeze([glade,point('meadow-stop',-68,-99),point('field-return-stop',-54,-65),point('field-gate-stop',-26,-61.5),point('settlement-approach',-6,-61.5),bay]),
 'northern-root':Object.freeze([glade,point('root-south-stop',-148,-86),point('root-mouth-stop',-148,-64),point('wetland-south-stop',-125,-57),point('wetland-north-stop',-125,-44),point('wetland-check-stop',-109,-28),point('camp-stop',-70,-8),point('north-pocket-bypass',-29,-9),point('west-spur-join',-20.4,-15),point('west-lane-north',-10,-15),point('west-lane-stop',-10,-34),point('settlement-approach',-6,-61.5),bay])
});
const CHOICES=Object.freeze({
 'south-stormfall':Object.freeze({route:'southern-meadow',branch:'stormfall-recovery',cargoKind:'supplier-short-timber'}),
 'north-stormfall':Object.freeze({route:'northern-root',branch:'stormfall-recovery',cargoKind:'supplier-short-timber'}),
 'south-coppice':Object.freeze({route:'southern-meadow',branch:'managed-coppice',cargoKind:'supplier-binding-fibre'}),
 'north-coppice':Object.freeze({route:'northern-root',branch:'managed-coppice',cargoKind:'supplier-binding-fibre'})
});
function required(choice){
 assert.ok(Object.hasOwn(CHOICES,choice),'declared route and content choice');
 return ROUTES[CHOICES[choice].route].slice(1).map(p=>'arrive-'+p.id);
}

module.exports={ROUTES,CHOICES,required};
