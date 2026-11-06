const N=64,CEIL=1.5,WCEIL=2.6;
// types: 1 grass, 2 stone, 3 mushroom, 4 leaf, 5 twig, 6 daisy, 7 poppy, 8 clover, 9 burrow
// underground: 10 soil, 11 glowing mushrooms, 12 roots, 13 exit to the meadow
// pond: 14 water, 16 reeds, 17 algae, 18 water-lily stem, 19 bank
const HEIGHT=[0,2.7,.9,1.7,1.4,.65,3.6,3.1,1.05,.9,CEIL,.75,CEIL,0,0,0,3.1,2.0,WCEIL,WCEIL];
const SWAY  =[0,1,0,.15,.35,0,.8,.8,.5,0,0,0,.6,0,0,0,.7,1.4,.35,0];
const SOLID =[0,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,1,0,0,1];
const EMIT  =[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0];
// plants the player walks through (grass, daisy, poppy, clover, reeds, algae)
const PASS  =[0,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,0,0];
const FULLH =[0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1];
const TYPE_COL=['#000','#5f9a35','#8d877a','#d24a3a','#7a8a2c','#7a5233','#f2efe2','#e0342a','#3f8f3a','#1a0d05','#1a120c','#5ff0d0','#8a6a44','#dfeeff','#3f7f8f','#000','#6a8a3a','#4f8a3a','#7a9a4a','#4a3a24'];
const GM=1024,GS=GM/N;

export { N, CEIL, WCEIL, HEIGHT, SWAY, SOLID, PASS, EMIT, FULLH, TYPE_COL, GM, GS };
