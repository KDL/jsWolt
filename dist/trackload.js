/*****************************************************
	
	Track::load-JS by Kallel A.Y
	Part of : JsVolt and jsWolt
	
	Licensed under MIT License.
	
******************************************************
			MIT License

			Copyright (c) 2016 Kallel Ahmed Yahia

			Permission is hereby granted, free of charge, to any person obtaining a copy
			of this software and associated documentation files (the "Software"), to deal
			in the Software without restriction, including without limitation the rights
			to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
			copies of the Software, and to permit persons to whom the Software is
			furnished to do so, subject to the following conditions:

			The above copyright notice and this permission notice shall be included in all
			copies or substantial portions of the Software.

			THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
			IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
			FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
			AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
			LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
			OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
			SOFTWARE.
*****************************************************/
//entry
console.info("Track::Load.JS --------------------------------\n\
				version 0.1 alpha							\n\
---------------------------------------------\n\
	\n\
	this software is licensed under MIT\n\
	Part of jsVolt (the Re-Volt file loader for Javascript)  and JsWolt (nVolt's WebGL implementation)\n\
	This preview is a property of Re-Volt fandom community and has no relation to Acclaim or WeGoInteractive whatsoever\n\
	\n\
	tool by Kallel A.Y\n\
.....................................................................");


//configuration
var rendElement = document.getElementById("renderWindow"); //window
var clearColor = 'rgb(0,0,0)';
var rendWidth = rendElement.style.width.replace("px","");  //window.innerWidth 
var rendHeight = rendElement.style.height.replace("px","");  //window.innerWidth 

var loadFIN = true;

//Dictionary of paths in parameters
//for instance, change every /levels/ to ./
//var dictOfPath = ["levels/","./"];
var dictOfPath = ["./","./"]; //tracks are stored in levels/.../

var camera, scene, fog, renderer, stats, showFPS;
var camdir=[0,0];

//init ListOfMeshes, each mesh has 4 submeshes, each containing a different material
//////////////////////////////////////////////////////////////////////////
//BEWARE: ListOfMeshes here IS DIFFERENT FROM CARLOAD JS !!!!!!!!!!!!!!!!
///////////////////////////////////////////////////////////////////////////
var listOfMeshes=Array(); //contains a list of meshes
//Each mesh has 10 bitmaps slots * 4 (envdblsd,env,dblsd, none) = 40

//TODO: fix the alpha or warn it (or UPGRADE TO r83)
//TODO: aerial, pin, envMap Coloring
//TODO: primitve rendering


//Some constants
const POLY_QUAD = 1;
const POLY_DBLSD = 2;
const POLY_TRANSL = 4;
const POLY_TRANS = 256;
//const POLY_ENVOFF = 1024; //reserved for PRM
POLY_ENVON = 2048; 

//const
const envDblsd=0;
const dblsd = 1;
const env = 2;
const nor = 3;

//Data structures

var Mesh = function() {
	var cubeCenter = new THREE.Vector3();
	var cubeRadius = 0.0;
	var bbox = new THREE.Box3(); //x,x,y,y,z,z
	var npoly = 0;
	var nvec = 0;
	var polygons = Array();
	var vertices = Array();

}

var poly  = function() {
 this.flag= 0;
 this.tpage = 0;
 this.vi = [0, 0, 0, 0];
 this.vxclr = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
 this.uv = [[0,0],[0,0],[0,0],[0,0]];
}

var vertex  = function() {
 this.position = [0.0, 0.0, 0.0];
 this.normal = [0.0, 0.0, 0.0];
}

var Instance = function() {
	this.envRGB = [255,25,255];
	this.pos = new THREE.Vector3();
	this.mat = new THREE.Matrix3();
	
	this.fileName ="";
	this.modelPtr = null;
	this.meshes = Array(); //will contain submeshes
}

//misc functions
//function isPolyQuad(flag) {return flag && 1;}


//Convert long Color to Color
var longColorToColor = function(clr) {
		this.a = clr >> 24 & 0xFF
        this.r = clr >> 16 & 0xFF
        this.g = clr >> 8 & 0xFF
        this.b = clr >> 0 & 0xFF
		
}
//Vectors
//init Vectors 
function initV(indx) {
	if(indx == 0) {
		return {modelNum: -1, offset1: [0,0,0], offset2: [0,0,0], isPresent: true};
	}
	else if(indx == 1) {
		return {modelNum:-1, offset: [0,0,0], length: 0.0};
	}
}

//difference: res = vec1-vec2
function diff(vec1,vec2) {
	return [vec1[0] - vec2[0],vec1[1] - vec2[1],vec1[2] - vec2[2]];
}

//difference: res = vec1-vec2
function addv(vec1,vec2) {
	return [vec1[0] + vec2[0],vec1[1] + vec2[1],vec1[2] + vec2[2]];
}

//length of vector: res = ||vec1||
function leng(vec1) {
	return Math.sqrt(vec1[0]*vec1[0] + vec1[1]*vec1[1]  + vec1[2]*vec1[2]);
}

//differenceLen: res = ||vec1-vec2||
function diffLeng(vec1,vec2) {
	diffr = diff(vec1,vec2);
	return leng(diffr);
}

//convert  vector of type array3 to vector
function arr2vec(arr) {
	return new THREE.Vector3(arr[0],arr[1],arr[2]);
}
function arr2vecNeg(arr) {
	return new THREE.Vector3(-arr[0],-arr[1],arr[2]);
}

//code from Re-Volt, for 3D interpolation (unused)
function interpolate3D(r0,r1,r2,t) {
//	r0,r1,r2 : interpolation vectors
//		t : the scalar

 
    var tSq = t * t;
	var X=0,Y=1,Z=2;
	var rt = Array(3);

    rt[X] = r0[X] * (2.0 * tSq - 3.0 * t + 1.0) + 
        r1[X] * (-4.0 * tSq + 4.0 * t) +
        r2[X] * (2.0 * tSq - t);
    rt[Y] = r0[Y] * (2.0 * tSq - 3.0 * t + 1.0) +
        r1[Y] * (-4.0 * tSq + 4.0 * t) +
        r2[Y] * (2.0 * tSq - t);
    rt[Z] = r0[Z] * (2.0 * tSq - 3.0 * t + 1.0) +
        r1[Z] * (-4.0 * tSq + 4.0 * t) +
        r2[Z] * (2.0 * tSq - t);

	return rt;

}

//--------- more declarations-----
	//Technical items
	
	var trackName ="", trackPath="";
	var startPos = new THREE.Vector3();
	var startRot = 0.0, farClip = 0.0, fogStart = 0.0;
	var wordlRgbPer = 100.0, modelRgbPer = 100.0, instanceRgbPer = 100.0;
	var fogColor = [0,0,0];
	
	//Visual stuffs
	var visMeshList; //contains a bucket of N_MESHES x 2 x 11 buckets x 4
	//2: Tri or Qd
	// 11 buckets = 10 BMPs + noTex
	// 4 : envDblsd, Dblsd,Env, none
	
	var slotId = 0; //valid rendered slot 
	
	
	var moveForward =false, moveLeft =false, moveRight =false, moveBackward =false;
	var velocity = new THREE.Vector3(0,0.25,0); //set it to a non-zero so initial update
	
	var isMouseDown = false,mouseDownPos=[0,0];
	var deltaTr = [0,0];
	
	var raycasterDown = new THREE.Raycaster();
	raycasterDown.ray.direction.set( 0, -1, 0 );
	var raycasterUp = new THREE.Raycaster();
	raycasterUp.ray.direction.set( 0, +1, 0 );

	
/// configuration
function trackloadjsconfigure(whereToRenderID,ShowFPS)
 {
 /* params:
	whereToRenderID: ID of the frame, it can be "window"
	ShowFPS: FPS counter element
 
 */

		if (whereToRenderID == "window") {
			rendElement = document.body;
			rendWidth = document.body.offsetWidth ;
			rendHeight = document.body.offsetHeight ;
		
		} else {
			rendElement = document.getElementById(whereToRenderID); //window
			rendWidth = rendElement.style.width.replace("px","");  //window.innerWidth 
			rendHeight = rendElement.style.height.replace("px","");  //window.innerWidth 
		
		}
		
		 showFPS = ShowFPS;
 }



//The man entry, allows the loading & the rendering of the whole track
var levelFolder = function(path,onFinish) {
/*params:
		path: path of level folder (full path)
		onFinish: Function to execute when the loading is finished
*/
	path = path.toString().replace(/\\g/,"/");
	trackPath = path; //set trackpath variable
	var foo = path.split("/");
	trackName =  foo[foo.length-1]==""?foo[foo.length-2]:foo[foo.length-1]; //set trackName variable
	
	
	
	var models=new Array(22);
	var tpage = "";
	var envRGB = [255,255,255];
	var curMode = 0; //Main(0), body(1),
	var curIdx = 0; //Index of the mode, like 0 in WHEEL 0 
	//	renderer.setClearColor( clearColor);
	
	//it's going to be a f*** if trackmaker uses ".inf" instead
	
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", path + "/" + trackName + ".inf" ,true);
	oReq.overrideMimeType("text/plain; charset=x-user-defined");
	oReq.onload = function (oEvent) {
		var textRead = oReq.responseText; 
		
		var key = "", secondKey="", Argument="",secondArgument;
		var lines = textRead.replace("}","}\n").replace("{","{\n").split('\r'); //make sure a new line is always there, then split
		while (lines.length > 0) {
			textRead = lines[0].split(";")[0].replace("\t"," ").trim(); //get the line
			lines.splice(0,1);											//remove line
			if (textRead.length <= 2  || textRead.indexOf(" ")==-1) continue;		//can be read
			
			key = textRead.split(/\s+/)[0].toUpperCase();
			secondKey = textRead.split(/\s+/)[1];
			Argument = textRead.split(/\s+/)[2];
			if(Argument!="")secondArgument = textRead.split(/\s+/)[3];
			
			//console.log("CurMode : " + curMode);
			//console.log(key + ":"   + secondKey + ":" + Argument+ ":" + secondArgument);
				switch(key) {
					case 'STARTPOS'	: startPos = new THREE.Vector3(-secondKey+0, -Argument + 50,+secondArgument);break;
					case 'STARTROT' : startRot = secondKey;break;
					case 'FARCLIP': farClip = secondKey;break;
					case 'FOGSTART': fogStart = secondKey;break;
					case 'FOGCOLOR'	: fogColor = [secondKey,Argument, secondArgument];break;
					case 'WORLDRGBPER'	: worldRgbPer = secondKey; break;
					case 'MODELRGBPER'	:modelRgbPer = secondKey; break;
					case 'INSTANCERGBPER'	: instanceRgbPer = secondKey;break;
				}

		} //reading
		
		//set renderer color, camera and foggs
		
		var clr = 'rgb('+fogColor[0]+','+fogColor[1]+','+fogColor[2]+')'; //clear color
		
		renderer.setClearColor(clr);
		camera.position.x = startPos.x ;
		camera.position.y = startPos.y ;
		camera.position.z = startPos.z ;
		
		camera.far = farClip;
		camera.rotation.y = startRot*Math.PI*2;
		
		
		camera.near = 0.01;
		
		
		
		scene.fog = new THREE.Fog(clr, fogStart, farClip);
		scene.add(camera);
		
		//jsWorld = function(path,envrgb,onRenderFinish)
		
		var wrlFile = new jsWorld(trackPath + "/" + trackName + ".w",worldRgbPer,
			function() {
				//load instances afterwards
				if(loadFIN) {
					new jsFileInstance(trackPath + "/" + trackName + ".fin",0);
					}
			}
		);
		
		
		// console.log(startPos);
		// console.log(startRot);
		// console.log(farClip);
		// console.log(fogStart);
		// console.log(fogColor);
		// console.log(worldRgbPer);
		// console.log(modelRgbPer);
		// console.log(instanceRgbPer);
				//variables!! temporary ones!
				var tmp,foo,bar,t;
	
			
			
			
				
				if (onFinish!=undefined) if(typeof onFinish == "function") onFinish();
		
		}
	oReq.send(null);
}

////// load & render a Re-Volt model file
var jsWorld = function(path,envrgb,onRenderFinish) {
/* Params:
	path: path of the World file
	envrrgb: percentage of shading
	onRenderFinish: Function to execute when it's loaded & sent to GPU

*/





	// fill a request about getting the WORLD file
	var oReq = new XMLHttpRequest();
	oReq.open("GET", path,true);
	oReq.overrideMimeType("text/plain; charset=x-user-defined");
	oReq.responseType = "arraybuffer";
	if (path==undefined) {
			console.error("File \"" + path + "\" was not successfully loaded.");
			return;
	}
			
	//Once the request is "ordered", get response
	oReq.onload = function (oEvent) {
		var offset = 0;
		var arrayBuffer = oReq.response; // Note: not oReq.responseText, copied from inet
		//console.log(path + " is loaded with length of " + arrayBuffer.length);
		
		//some temporary loc var
		var bmpBucket, qds, tris;
		
	
		var view = new jDataView(oReq.response); //create new "binary reader"
		var meshCount = view.getInt32(offset,1); offset+=4; //get npoly
		
		//meshCount = 255;
		
		
		// init the visual stuffs
		visMeshList = Array(meshCount);
		
		
		//read each mesh
		for(var iMesh = 0 ; iMesh < meshCount; iMesh++) {
			var mmesh = new Mesh(); //technical part
			visMeshList[iMesh] = [Array(11),Array(11)]; //Tri,Qd
			for(iBmp = 0; iBmp < 11; iBmp++) {visMeshList[iMesh][0][iBmp] = [Array(),Array(),Array(),Array()]; visMeshList[iMesh][1][iBmp] = [Array(),Array(),Array(),Array()];}
			mmesh.cubeCenter = new THREE.Vector3(-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); 
			offset += 12;
			mmesh.cubeRadius = view.getFloat32(offset,1); offset +=4;
			var xmin = view.getFloat32(offset + 0,1);
			var xmax = view.getFloat32(offset + 4,1);
			var ymin = view.getFloat32(offset + 8,1);
			var ymax = view.getFloat32(offset + 12,1);
			var zmin = view.getFloat32(offset + 16,1);
			var zmax = view.getFloat32(offset + 20,1);
			offset += 24;
			mmesh.bbox = new THREE.Box3(new THREE.Vector3(xmin,ymin,zmin),new THREE.Vector3(xmax,ymax,zmax));
			mmesh.npoly = view.getInt16(offset,1); offset+=2; 
			mmesh.nvec =  view.getInt16(offset,1); offset+=2; //get nvec
			
			//console.log("nvec:" + mmesh.nvec);
			
			//ok, init sizes
			mmesh.polygons = Array(mmesh.npoly);
			mmesh.vertices = Array(mmesh.nvec);
			
			
			//load each poly
			for (var iPoly = 0 ; iPoly < mmesh.npoly ; iPoly++) {
				//#start COPY_PASTE_CARLOAD_POLY_LOAD
			
				var p = new poly();
				p.flag  = view.getInt16(offset,1); offset+=2; 
				p.tpage  = view.getInt16(offset,1); offset+=2; 

				p.vi = [view.getInt16(offset,1),view.getInt16(offset+2,1),view.getInt16(offset+4,1),view.getInt16(offset+6,1)];offset+=8; 
				p.c = [view.getInt32(offset,1),view.getInt32(offset+4,1),view.getInt32(offset+8,1),view.getInt32(offset+12,1)];offset+=16; 
				p.uv[0] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
				p.uv[1] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
				p.uv[2] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
				p.uv[3] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
				
				//select "buckets"
				bmpBucket = (p.tpage <= -1)?10:p.tpage;
				if(p.flag & POLY_QUAD)
				{
					if((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVON)) visMeshList[iMesh][1][bmpBucket][0].push(p);
					else if(p.flag & POLY_DBLSD) visMeshList[iMesh][1][bmpBucket][1].push(p);
					else if(p.flag & POLY_ENVON) visMeshList[iMesh][1][bmpBucket][2].push(p);
					else  visMeshList[iMesh][1][bmpBucket][3].push(p);
				
					 
					
				} else {
					if((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVON)) visMeshList[iMesh][0][bmpBucket][0].push(p);
					else if(p.flag & POLY_DBLSD) visMeshList[iMesh][0][bmpBucket][1].push(p);
					else if(p.flag & POLY_ENVON) visMeshList[iMesh][0][bmpBucket][2].push(p);
					else  visMeshList[iMesh][0][bmpBucket][3].push(p);
				
					 
				
				}
				
				/*|(POLY_DBLSD|POLY_ENVON))) { visMeshList[iMesh][1][bmpBucket][3].push(p);t++;}
				else if(p.flag & (POLY_QUAD|POLY_DBLSD)) visMeshList[iMesh][1][bmpBucket][2].push(p);
				else if(p.flag & (POLY_QUAD|POLY_ENVON)) visMeshList[iMesh][1][bmpBucket][1].push(p);
				else if(p.flag & (POLY_QUAD)) visMeshList[iMesh][1][bmpBucket][0].push(p);
				else if(p.flag & (POLY_DBLSD|POLY_ENVON)) visMeshList[iMesh][0][bmpBucket][3].push(p);
				else if(p.flag & POLY_DBLSD) visMeshList[iMesh][0][bmpBucket][2].push(p);
				else if(p.flag & POLY_ENVON) visMeshList[iMesh][0][bmpBucket][1].push(p);
				else visMeshList[iMesh][0][bmpBucket][0].push(p);*/
					
			
			
				//#end COPY_PASTE_CARLOAD_POLY_LOAD
				mmesh.polygons[iPoly] = p; //will it not be dereferenced this way???
			}
			
			//generate state
			if( true 	&&false		) {
			console.log("Mesh " + iMesh);
				for(var bmp = 0; bmp < 11 ; bmp++)
				{	
				console.log("\tBitamp (" + bmp + ")");
					console.log("\t\tenv+dblsd---  qds:" + visMeshList[iMesh][1][bmpBucket][envDblsd].length 
					 +", tris:" + visMeshList[iMesh][0][bmpBucket][envDblsd].length);
					console.log("\t\tdblsd---  qds:" + visMeshList[iMesh][1][bmpBucket][dblsd].length 
					 +", tris:" + visMeshList[iMesh][0][bmpBucket][dblsd].length);
					console.log("\t\tenv---  qds:" + visMeshList[iMesh][1][bmpBucket][env].length 
					 +", tris:" + visMeshList[iMesh][0][bmpBucket][env].length);
					console.log("\t\tnone---  qds:" + visMeshList[iMesh][1][bmpBucket][nor].length 
					 +", tris:" + visMeshList[iMesh][0][bmpBucket][nor].length);
				}
			
			
			}
			
			
			
			//load each vertex
			for (var iVec = 0 ; iVec <  mmesh.nvec ; iVec++) {
				var v = new vertex();
				//visVxListPos.push(view.getFloat32(offset,1),view.getFloat32(offset,1)*-1,view.getFloat32(offset,1)); offset+=12; 
				v.position  = [-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
				//visVxListNor.push(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); offset +=12;
				v.normal  = [view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
				mmesh.vertices[iVec] = v;
				
			}
			
			//Alright! we may start rendering stuffs then
			for(var bmpBucket = 0; bmpBucket < 11 ; bmpBucket++)
			{
				for(var bckt = 0; bckt < 4 ; bckt++) {
				//first, don't do anything for "empty stuffs"
				//console.log(bckt);
				//console.log(visMeshList[iMesh][0][bmpBucket][bckt]);
				//console.log(visMeshList[iMesh][1][bmpBucket][bckt]);
				//console.log("ok");
				if (visMeshList[iMesh][1][bmpBucket][bckt].length != 0 || visMeshList[iMesh][0][bmpBucket][bckt].length !=0)  {
					qds = visMeshList[iMesh][1][bmpBucket][bckt];
					tris = visMeshList[iMesh][0][bmpBucket][bckt];
					X=fillVisualBuckets (tris,qds,mmesh.vertices);
					//console.log(trackPath+"/"+trackName + String.fromCharCode(97+bmpc)+".bmp");
					if(bmpBucket!=10) addPoliesTex(X[1],X[2],X[0],X[4],X[3],trackPath+"/"+trackName + String.fromCharCode(97+bmpBucket)+".bmp",envrgb,bmpBucket,bckt,0);
					else addPoliesTex(X[1],X[2],X[0],X[4],X[3],"",envrgb,bmpBucket,bckt,0);
				
				}
				}
				
			}
			
			
			
		}
		
		if (typeof onRenderFinish=="function")onRenderFinish();
			
		view = []; //remove all the view
		
	
	//------------------------------------ step 2, rendering
	
	//treat Textured elements
	
	//X=fillVisualBuckets (TriTex,QdTex,vertices);
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	//addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,3,0);
	
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	/*X=fillVisualBuckets (TriTex,QdTex,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,3,0);
	X=fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,2,0);
	X=fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,1,0);
	X=fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,3,onRenderFinish);*/
	
	
	
	/*[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,2,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,1,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,0,onRenderFinish);*/
	
	
	
};
/*this.meshIdx = slot;

this.Ready = 0;*/
oReq.send(null); //send request
}

////// load & render a Re-Volt model file
var jsvModel = function(path,instIdx,envrgb,onRenderFinish) {
/* Params:
	path: path of the model file
	texmap: path of the texture
	envRGB: Array(3) of color , in bytes
	slot  : The index of "listOfMeshes" that will be assigned to this model
	onRenderFinish: Function to execute when it's loaded & sent to GPU

*/

	//We make the polygon another mesh hmmm...

	

	// fill a request about getting a PRM model
	var oReq = new XMLHttpRequest();
	oReq.open("GET", path,true);
	oReq.overrideMimeType("text/plain; charset=x-user-defined");
	oReq.responseType = "arraybuffer";
	if (path==undefined) {
			console.error("File \"" + path + "\" was not successfully loaded.");
			return;
	}
			
	//Once the request is "ordered", get response
	oReq.onload = function (oEvent) {
		var offset = 0;
		var arrayBuffer = oReq.response; // Note: not oReq.responseText, copied from inet
		//console.log(path + " is loaded with length of " + arrayBuffer.length);
		
		//We make it as another mesh, we generate its ID & placeholders
		var iMesh = visMeshList.length; //needed b/c async
		visMeshList.push(new Mesh()); 
		visMeshList[iMesh] = [Array(11),Array(11)]; //Tri,Qd
		for(iBmp = 0; iBmp < 11; iBmp++) {visMeshList[iMesh][0][iBmp] = [Array(),Array(),Array(),Array()]; visMeshList[iMesh][1][iBmp] = [Array(),Array(),Array(),Array()];}
	
	
		var view = new jDataView(oReq.response); //create new "binary reader"
		var npoly = view.getInt16(offset,1); offset+=2; //get npoly
		var nvec =  view.getInt16(offset,1); offset+=2; //get nvec
		
		var vertices = Array(nvec); //allocate vertices
		
		//buffersize
		//visVxListPos = new Float32Array(nvec *3); //NO!!! Just no
		//visIdxList = new Uint32Array(nvec * 3);
		//console.log(nvec +" ," + npoly);
		//load each poly, append it to the buffer
		for (var i = 0 ; i < npoly ; i++) {
			var p = new poly();
			p.flag  = view.getInt16(offset,1); offset+=2; 
			p.tpage  = view.getInt16(offset,1); offset+=2; 

			p.vi = [view.getInt16(offset,1),view.getInt16(offset+2,1),view.getInt16(offset+4,1),view.getInt16(offset+6,1)];offset+=8; 
			p.c = [view.getInt32(offset,1),view.getInt32(offset+4,1),view.getInt32(offset+8,1),view.getInt32(offset+12,1)];offset+=16; 
			p.uv[0] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
			p.uv[1] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
			p.uv[2] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
			p.uv[3] = [view.getFloat32(offset,1),view.getFloat32(offset+4,1)];offset+=8; 
			
			//select "buckets"
				var bmpBucket = (p.tpage <= -1)?10:p.tpage;
				if(p.flag & POLY_QUAD)
				{
					if((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVON)) visMeshList[iMesh][1][bmpBucket][0].push(p);
					else if(p.flag & POLY_DBLSD) visMeshList[iMesh][1][bmpBucket][1].push(p);
					else if(p.flag & POLY_ENVON) visMeshList[iMesh][1][bmpBucket][2].push(p);
					else  visMeshList[iMesh][1][bmpBucket][3].push(p);
				
					 
					
				} else {
					if((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVON)) visMeshList[iMesh][0][bmpBucket][0].push(p);
					else if(p.flag & POLY_DBLSD) visMeshList[iMesh][0][bmpBucket][1].push(p);
					else if(p.flag & POLY_ENVON) visMeshList[iMesh][0][bmpBucket][2].push(p);
					else  visMeshList[iMesh][0][bmpBucket][3].push(p);
				
					 
				
				}
			
		/*	if (p.tpage == -1 && (p.flag & 1)) QdPrimPolies.push(p);
			else if (p.tpage != -1 && (p.flag & 1)) QdTexPolies.push(p);
			else if (p.tpage == -1) TriPrimPolies.push(p);
			else TriTexPolies.push(p);*/
		}
		
	
			
			//load each vertex
		for (var i = 0 ; i < nvec ; i++) {
			var v = new vertex();
			//visVxListPos.push(view.getFloat32(offset,1),view.getFloat32(offset,1)*-1,view.getFloat32(offset,1)); offset+=12; 
			v.position  = [-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
			//visVxListNor.push(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); offset +=12;
			v.normal  = [view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
			vertices[i] = v;
			
		}
		
			//Alright! we may start rendering stuffs then
			for(var bmpBucket = 0; bmpBucket < 11 ; bmpBucket++)
			{
				for(var bckt = 0; bckt < 4 ; bckt++) {
				//first, don't do anything for "empty stuffs"
				//console.log(bckt);
				//console.log(visMeshList[iMesh][0][bmpBucket][bckt]);
				//console.log(visMeshList[iMesh][1][bmpBucket][bckt]);
				//console.log("ok");
				if (visMeshList[iMesh][1][bmpBucket][bckt].length != 0 || visMeshList[iMesh][0][bmpBucket][bckt].length !=0)  {
					qds = visMeshList[iMesh][1][bmpBucket][bckt];
					tris = visMeshList[iMesh][0][bmpBucket][bckt];
					X=fillVisualBuckets (tris,qds,vertices);
					//console.log(trackPath+"/"+trackName + String.fromCharCode(97+bmpc)+".bmp");
					if(bmpBucket!=10) listOfInstances[instIdx].meshes.push( addPoliesTex(X[1],X[2],X[0],X[4],X[3],trackPath+"/"+trackName + String.fromCharCode(97+bmpBucket)+".bmp",envrgb,bmpBucket,bckt,0));
					else listOfInstances[instIdx].meshes.push(addPoliesTex(X[1],X[2],X[0],X[4],X[3],"",envrgb,bmpBucket,bckt,0));
				
				}
				}
				
			}
			
			
		view = []; //remove all the view
		if (typeof onRenderFinish =="function")onRenderFinish(iMesh); //send mesh index
		
	
	//------------------------------------ step 2, rendering
	
	//treat Textured elements
	//X=fillVisualBuckets (TriTex,QdTex,vertices);
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	//addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,3,0);
	
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	/*X=fillVisualBuckets (TriTex,QdTex,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,3,0);
	X=fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,2,0);
	X=fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,1,0);
	X=fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,3,onRenderFinish);*/
	
	
	
	/*[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,2,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,1,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,0,onRenderFinish);*/
	
	
	
};
//this.meshIdx = slot;
/*this.render = function() {this.meshIdx = addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,onRenderFinish)};*/

this.Ready = 0;
oReq.send(null); //send request
}

var ply;
 function fillVisualBuckets (TriTexPolies,QdTexPolies,vertices) {
 
 //console.log(vertices[ply.vi[0]]);
 
	visIdxList = new Uint32Array(TriTexPolies.length*3 + QdTexPolies.length * 6);
	 visVxPosList = new Float32Array(TriTexPolies.length*3*3+ QdTexPolies.length * 6*3);
	 visVxNorList = new Float32Array(TriTexPolies.length*3*3+ QdTexPolies.length * 6*3);
	 visVxColorList = new Uint8Array(TriTexPolies.length*3*3+ QdTexPolies.length * 6*3);
	 visVxUVList = new Float32Array(TriTexPolies.length*3*2+ QdTexPolies.length * 6*2);
	
	
	var offs3 = TriTexPolies.length * 3;
	var offs9 = TriTexPolies.length * 9;
	var offs18 = TriTexPolies.length * 18;
	var offs6 = TriTexPolies.length * 6;
	//Process textured tris
	//console.log(TriTexPolies.length);
	for(var i = 0 ; i < TriTexPolies.length ; i++) {
		ply = TriTexPolies[i];
		visIdxList[3*i+0] = 3*i+0;
		visIdxList[3*i+1] = 3*i+2;
		visIdxList[3*i+2] = 3*i+1;
		
		visVxPosList[9*i+0] = vertices[ply.vi[0]].position[0];
		visVxPosList[9*i+1] = vertices[ply.vi[0]].position[1];
		visVxPosList[9*i+2] = vertices[ply.vi[0]].position[2];
		visVxPosList[9*i+3] = vertices[ply.vi[1]].position[0];
		visVxPosList[9*i+4] = vertices[ply.vi[1]].position[1];
		visVxPosList[9*i+5] = vertices[ply.vi[1]].position[2];
		visVxPosList[9*i+6] = vertices[ply.vi[2]].position[0];
		visVxPosList[9*i+7] = vertices[ply.vi[2]].position[1];
		visVxPosList[9*i+8] = vertices[ply.vi[2]].position[2];
		
		
		visVxNorList[9*i+0] = vertices[ply.vi[0]].normal[0];
		visVxNorList[9*i+1] = vertices[ply.vi[0]].normal[1];
		visVxNorList[9*i+2] = vertices[ply.vi[0]].normal[2];
		visVxNorList[9*i+3] = vertices[ply.vi[1]].normal[0];
		visVxNorList[9*i+4] = vertices[ply.vi[1]].normal[1];
		visVxNorList[9*i+5] = vertices[ply.vi[1]].normal[2];
		visVxNorList[9*i+6] = vertices[ply.vi[2]].normal[0];
		visVxNorList[9*i+7] = vertices[ply.vi[2]].normal[1];
		visVxNorList[9*i+8] = vertices[ply.vi[2]].normal[2];
		
		
		visVxUVList[6*i+0] = ply.uv[0][0];
		visVxUVList[6*i+1] = 1-ply.uv[0][1];
		visVxUVList[6*i+2] = ply.uv[1][0];
		visVxUVList[6*i+3] = 1-ply.uv[1][1];
		visVxUVList[6*i+4] = ply.uv[2][0];
		visVxUVList[6*i+5] = 1-ply.uv[2][1];
		
		
		c = new longColorToColor(ply.c[0]);
		visVxColorList[9*i+0] = c.r;
		visVxColorList[9*i+1] = c.g;
		visVxColorList[9*i+2] = c.b;
		c = new longColorToColor(ply.c[1]);
		visVxColorList[9*i+3] = c.r;
		visVxColorList[9*i+4] = c.g;
		visVxColorList[9*i+5] = c.b;
		c = new longColorToColor(ply.c[2]);
		visVxColorList[9*i+6] = c.r;
		visVxColorList[9*i+7] = c.g;
		visVxColorList[9*i+8] = c.b;
		
	}
	
	//console.log("offset:" + offs3);

	
	for(var i = 0 ; i < QdTexPolies.length ; i++) {
		ply = QdTexPolies[i];
		visIdxList[6*i+0+offs3] =offs3+ 6*i+0;
		visIdxList[6*i+1+offs3] =offs3+ 6*i+2;
		visIdxList[6*i+2+offs3] =offs3+ 6*i+1;
		
		visIdxList[6*i+3+offs3] =offs3+ 6*i+3;
		visIdxList[6*i+4+offs3] =offs3+ 6*i+5;
		visIdxList[6*i+5+offs3] =offs3+ 6*i+4;
		

		visVxPosList[18*i+0+offs9] = vertices[ply.vi[0]].position[0];
		visVxPosList[18*i+1+offs9] = vertices[ply.vi[0]].position[1];
		visVxPosList[18*i+2+offs9] = vertices[ply.vi[0]].position[2];
		visVxPosList[18*i+3+offs9] = vertices[ply.vi[1]].position[0];
		visVxPosList[18*i+4+offs9] = vertices[ply.vi[1]].position[1];
		visVxPosList[18*i+5+offs9] = vertices[ply.vi[1]].position[2];
		visVxPosList[18*i+6+offs9] = vertices[ply.vi[2]].position[0];
		visVxPosList[18*i+7+offs9] = vertices[ply.vi[2]].position[1];
		visVxPosList[18*i+8+offs9] = vertices[ply.vi[2]].position[2];
		
		visVxPosList[18*i+9+offs9] = vertices[ply.vi[0]].position[0];
		visVxPosList[18*i+10+offs9] = vertices[ply.vi[0]].position[1];
		visVxPosList[18*i+11+offs9] = vertices[ply.vi[0]].position[2];
		visVxPosList[18*i+12+offs9] = vertices[ply.vi[2]].position[0];
		visVxPosList[18*i+13+offs9] = vertices[ply.vi[2]].position[1];
		visVxPosList[18*i+14+offs9] = vertices[ply.vi[2]].position[2];
		visVxPosList[18*i+15+offs9] = vertices[ply.vi[3]].position[0];
		visVxPosList[18*i+16+offs9] = vertices[ply.vi[3]].position[1];
		visVxPosList[18*i+17+offs9] = vertices[ply.vi[3]].position[2];
				
		visVxNorList[18*i+0+offs9] = vertices[ply.vi[0]].normal[0];
		visVxNorList[18*i+1+offs9] = vertices[ply.vi[0]].normal[1];
		visVxNorList[18*i+2+offs9] = vertices[ply.vi[0]].normal[2];
		visVxNorList[18*i+3+offs9] = vertices[ply.vi[1]].normal[0];
		visVxNorList[18*i+4+offs9] = vertices[ply.vi[1]].normal[1];
		visVxNorList[18*i+5+offs9] = vertices[ply.vi[1]].normal[2];
		visVxNorList[18*i+6+offs9] = vertices[ply.vi[2]].normal[0];
		visVxNorList[18*i+7+offs9] = vertices[ply.vi[2]].normal[1];
		visVxNorList[18*i+8+offs9] = vertices[ply.vi[2]].normal[2];
		
		visVxNorList[18*i+9+offs9] = vertices[ply.vi[0]].normal[0];
		visVxNorList[18*i+10+offs9] = vertices[ply.vi[0]].normal[1];
		visVxNorList[18*i+11+offs9] = vertices[ply.vi[0]].normal[2];
		visVxNorList[18*i+12+offs9] = vertices[ply.vi[2]].normal[0];
		visVxNorList[18*i+13+offs9] = vertices[ply.vi[2]].normal[1];
		visVxNorList[18*i+14+offs9] = vertices[ply.vi[2]].normal[2];
		visVxNorList[18*i+15+offs9] = vertices[ply.vi[3]].normal[0];
		visVxNorList[18*i+16+offs9] = vertices[ply.vi[3]].normal[1];
		visVxNorList[18*i+17+offs9] = vertices[ply.vi[3]].normal[2];
			
	
		visVxUVList[12*i+0+offs6] = ply.uv[0][0];
		visVxUVList[12*i+1+offs6] = 1-ply.uv[0][1];
		visVxUVList[12*i+2+offs6] = ply.uv[1][0];
		visVxUVList[12*i+3+offs6] = 1-ply.uv[1][1];
		visVxUVList[12*i+4+offs6] = ply.uv[2][0];
		visVxUVList[12*i+5+offs6] = 1-ply.uv[2][1];
		
		visVxUVList[12*i+6+offs6] = ply.uv[0][0];
		visVxUVList[12*i+7+offs6] = 1-ply.uv[0][1];
		visVxUVList[12*i+8+offs6] = ply.uv[2][0];
		visVxUVList[12*i+9+offs6] = 1-ply.uv[2][1];
		visVxUVList[12*i+10+offs6] = ply.uv[3][0];
		visVxUVList[12*i+11+offs6] = 1-ply.uv[3][1];
		
		//TODO: alpha support
		c = new longColorToColor(ply.c[0]);
		visVxColorList[18*i+0+offs9] = c.r;
		visVxColorList[18*i+1+offs9] = c.g;
		visVxColorList[18*i+2+offs9] = c.b;
		c = new longColorToColor(ply.c[1]);
		visVxColorList[18*i+3+offs9] = c.r;
		visVxColorList[18*i+4+offs9] = c.g;
		visVxColorList[18*i+5+offs9] = c.b;
		c = new longColorToColor(ply.c[2]);
		visVxColorList[18*i+6+offs9] = c.r;
		visVxColorList[18*i+7+offs9] = c.g;
		visVxColorList[18*i+8+offs9] = c.b;
		
		c = new longColorToColor(ply.c[0]);
		visVxColorList[18*i+9+offs9] = c.r;
		visVxColorList[18*i+10+offs9] = c.g;
		visVxColorList[18*i+11+offs9] = c.b;
		c = new longColorToColor(ply.c[2]);
		visVxColorList[18*i+12+offs9] = c.r;
		visVxColorList[18*i+13+offs9] = c.g;
		visVxColorList[18*i+14+offs9] = c.b;
		c = new longColorToColor(ply.c[3]);
		visVxColorList[18*i+15+offs9] = c.r;
		visVxColorList[18*i+16+offs9] = c.g;
		visVxColorList[18*i+17+offs9] = c.b;
		
	}
	
	return [visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList];
	
 
 }
 
 var listOfInstances = Array();
 var jsFileInstance = function(path,onRenderFinish) {
/* Params:
	path: path of the World file
	onRenderFinish: Function to execute when it's loaded & sent to GPU

*/

//path = path.replace("nhood1.fin","NHood1.fin");
	//console.log(path);

	

	// fill a request about getting the WORLD file
	var oReq = new XMLHttpRequest();
	oReq.open("GET", path,true);
	oReq.overrideMimeType("text/plain; charset=x-user-defined");
	oReq.responseType = "arraybuffer";
	if (path==undefined) {
			console.error("File \"" + path + "\" was not successfully loaded.");
			return;
	}
			
	//Once the request is "ordered", get response
	oReq.onload = function (oEvent) {
		var offset = 0;
		var arrayBuffer = oReq.response; // Note: not oReq.responseText, copied from inet
		//console.log(path + " is loaded with length of " + arrayBuffer.length);
		
		//some temporary loc var
		
	
		var view = new jDataView(oReq.response); //create new "binary reader"
		var incount = view.getInt32(offset,1); offset+=4; //get npoly
		
		listOfInstances = Array(incount);
		//meshCount = 255;
		
		
		// init the visual stuffs
		meshList = Array(incount);
		var str,r,g,b,envrgb,prio;
		
		for(var inst=0; inst<incount; inst++) {
		
			listOfInstances[inst] = new Instance();
			
			
			/*this.envRGB = [255,25,255];
	this.pos = new THREE.Vector3();
	this.mat = new THREE.Matrix3();*/
			
			
			str=view.getString(9,offset);offset+=9;
			getRealPRMName(str,inst,function(fileName,instIdx){
				//continue filling
				listOfInstances[instIdx].fileName = (trackPath + "/" + fileName).replace(/\/\//g,"/");
				listOfInstances[instIdx].modelPtr = new jsvModel(listOfInstances[instIdx].fileName,instIdx,listOfInstances[instIdx].envRGB,
					function(meshIdx) {
						//console.info(listOfInstances[instIdx]);
						for(m in listOfInstances[instIdx].meshes) {
						
							//TODO: Why did I use Matrix3 ???
							var q = new THREE.Matrix4().set(
							+listOfInstances[instIdx].mat.elements[0],+listOfInstances[instIdx].mat.elements[1],+listOfInstances[instIdx].mat.elements[2],0,
							+listOfInstances[instIdx].mat.elements[3],+listOfInstances[instIdx].mat.elements[4],+listOfInstances[instIdx].mat.elements[5],0,
							+listOfInstances[instIdx].mat.elements[6],+listOfInstances[instIdx].mat.elements[7],+listOfInstances[instIdx].mat.elements[8],0,
							0,0,0,1
							
							);
							q.transpose(); //And this AMAZING filling :P (TODO, optimization)
							
							//Alright, apply matrix now (Convert it to RV Basis, Do Matrix Multiplication and Get it back to GL Basis)
							q = new THREE.Matrix4().makeScale (-1, -1,+1 ).multiply(q);
							q.multiply(new THREE.Matrix4().makeScale ( -1, -1, +1 ));
							listOfInstances[instIdx].meshes[m].applyMatrix(q);
							
							listOfInstances[instIdx].meshes[m].position.x = listOfInstances[instIdx].pos.x;
							listOfInstances[instIdx].meshes[m].position.y = listOfInstances[instIdx].pos.y;
							listOfInstances[instIdx].meshes[m].position.z = listOfInstances[instIdx].pos.z;
						}
					}
				) 
				
			//console.log(fileName +"["+listOfInstances[instIdx]+"]");
			
			});
			
			//[view.getBytes(1,offset+0) ,view.getBytes(1,offset+1) ,view.getBytes(1,offset+2) ];
			listOfInstances[inst].envRGB = longColorToColor(view.getUint32(offset+3) );
			//console.log( listOfInstances[inst].envRGB ); //error
			
			
			offset+=7;
			
			offset+=8;	
			listOfInstances[inst].pos = new THREE.Vector3(-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); 
			//console.log(listOfInstances[inst].pos);
			offset+=12;
			
			var dd= new THREE.Vector3(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); offset+=12;
			var ee =new THREE.Vector3(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); offset+=12;
			var ff= new THREE.Vector3(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1));  offset+=12;
			
			listOfInstances[inst].mat.set( dd.x,ee.x,ff.x,dd.y,ee.y,ff.y,dd.z,ee.z,ff.z);
			//console.log(listOfInstances[inst].mat);
			
			
		}
		
		/*  char Name[MAX_INSTANCE_FILENAME];
    char r, g, b;
    unsigned long EnvRGB;
    unsigned char Priority, Flag, pad[2];
    float LodBias;
    VEC WorldPos;
    MAT WorldMatrix;*/
		
		//read each mesh
		/*for(var iMesh = 0 ; iMesh < meshCount; iMesh++) {
			var mmesh = new Mesh(); //technical part
			visMeshList[iMesh] = [Array(11),Array(11)]; //Tri,Qd
			for(iBmp = 0; iBmp < 11; iBmp++) {visMeshList[iMesh][0][iBmp] = [Array(),Array(),Array(),Array()]; visMeshList[iMesh][1][iBmp] = [Array(),Array(),Array(),Array()];}
			mmesh.cubeCenter = new THREE.Vector3(-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); 
			offset += 12;
			mmesh.cubeRadius = view.getFloat32(offset,1)
			}*/
			};
			
			oReq.send(null);
	}


	
   /* init();
    animate();*/

    function initSceneAndCamera() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, rendWidth / rendHeight, 1, 10000 );
        /*camera.position.z = 150;
        camera.position.y = 80;
        camera.position.x = 100;*/
	}
	
	 var envtex; //global variables, TODO: put them into a list
	  
	  
	  var loadedTextures = [];
	  var loadedMaterials = Array(11);
	  var canvas = [];
	  
	  
	function addPoliesTex(visVxListPos,visVxListNor,visIdxList,visUVList,visColorList,texmap,envrgb,modelSlot,matIdx,onRenderFinish) {	  
	 var geometry =  new THREE.BufferGeometry();
	  //console.log(visVxListPos);
	  geometry.addAttribute( 'position', new THREE.BufferAttribute( visVxListPos, 3 ));
	  geometry.addAttribute( 'normal', new THREE.BufferAttribute( visVxListNor, 3 , true));
	  geometry.addAttribute( 'color', new THREE.BufferAttribute( visColorList, 3, true ));
	   geometry.addAttribute( 'uv', new THREE.BufferAttribute( visUVList, 2, true ));
	  geometry.setIndex( new THREE.BufferAttribute(   visIdxList, 1 ) );
	  geometry.computeBoundingBox();
	  
	 // console.log(texmap +":" + loadedTextures + "Index : " + loadedTextures.indexOf(texmap));
	  
	  //Append texture (and material)
	  if (loadedMaterials[modelSlot]== undefined ) {//only create texture when it's new
			
			  
			   var texture = new THREE.TextureLoader().load( texmap , function ( texture ) {
				
					var tname = texture.image.src.split("/")[texture.image.src.split("/").length-1].replace(".bmp","").replace(trackName,"").toLowerCase();
					var idx = tname=="a"?0:tname=="b"?1:tname=="c"?2:tname=="d"?3:tname=="e"?4:tname=="f"?5:tname=="g"?6:tname=="h"?7:tname=="i"?8:tname=="j"?9:10;
					//console.log(idx);
					// do something with it

					// like drawing a part of it on a canvas
				   var canvas = document.createElement( 'canvas' );
				   canvas.width = texture.image.width;
				   canvas.height = texture.image.height;
					var context = canvas.getContext( '2d' );
					context.drawImage(texture.image,0,0);
					var imgData=context.getImageData(0,0,texture.image.width,texture.image.height);
					//console.log(imgData.data.length);
					for (var i=0;i<imgData.data.length;i+=4)
					  {
					 // if (imgData.data[i+0]== 0 && imgData.data[i+1] == 0 && imgData.data[i+2] == 0)  imgData.data[i+3]=0;
					  if (imgData.data[i+0]== 0 && imgData.data[i+1] == 0 && imgData.data[i+2] == 0)  imgData.data[i+0]=imgData.data[i+1]=imgData.data[i+2]=0;
					  else {r = imgData.data[i+3]; imgData.data[i+0]=imgData.data[i+1]=imgData.data[i+2]=r;}
					 // console.log("test");
					  }
					  context.putImageData(imgData,0,0);
					  //context.save();
					
					//console.log(canvas);
					  
					  
					//if(loadedTextures[c].indexOf(tname)!=-1) {
						for(j=0; j < 4; j++) {
							loadedMaterials[idx][j].alphaMap = new THREE.CanvasTexture( canvas , THREE.UVMapping );
							loadedMaterials[idx][j].alphaMap.needsUpdate = true;
							}
					
					// loadedMaterials[0]
		});
			   texture.premultiplyAlpha = true;
			   alpmap = new THREE.TextureLoader().load( texmap );
			  // alpmap.format = THREE.LuminanceFormat   ;
			   //console.log(alpmap);
			   envtex = new THREE.TextureLoader().load( "./dist/Envroll.bmp"); /*, function ( texture ) {
				// do something with it

					// like drawing a part of it on a canvas
				   var canvas = document.createElement( 'canvas' );
				   canvas.width = texture.image.width;
				   canvas.height = texture.image.height;
					var context = canvas.getContext( '2d' );
					context.drawImage(texture.image,0,0);
					var imgData=context.getImageData(0,0,texture.image.width,texture.image.height);
					//console.log(imgData.data.length);
					for (var i=0;i<imgData.data.length;i+=4)
					  {
					  imgData.data[i+0] *= envRGB[0]/255.0;
					  imgData.data[i+1] *= envRGB[1]/255.0;
					  imgData.data[i+2] *= envRGB[2]/255.0;
					 // if (imgData.data[i+0]== 0 && imgData.data[i+1] == 0 && imgData.data[i+2] == 0)  imgData.data[i+3]=0;
					//  if (imgData.data[i+0]== 0 && imgData.data[i+1] == 0 && imgData.data[i+2] == 0)  imgData.data[i+0]=imgData.data[i+1]=imgData.data[i+2]=0;
					//  else {r = imgData.data[i+3]; imgData.data[i+0]=imgData.data[i+1]=imgData.data[i+2]=r;}
					 // console.log("test");
					  }
					  context.putImageData(imgData,0,0);
					  //context.save();
					
					//console.log(canvas);
					  
					  for (var c = 0; c < loadedTextures.length; c++)

						for(j in [0,2]) {
							loadedMaterials[j][c].envMap = new THREE.CanvasTexture( canvas , THREE.UVMapping );
							loadedMaterials[j][c].envMap.needsUpdate = true;
							}
					});*/
			   envtex.mapping = THREE.SphericalReflectionMapping;
			   envtex.wrapS = THREE.RepeatWrapping;
			   envtex.wrapT = THREE.RepeatWrapping;
			   //envtex.repeat.set( 8, 8 );
				   
			   material = new THREE.MeshStandardMaterial( { /*color:'rgb('+envrgb.join(',')+')',*/  vertexColors: THREE.VertexColors, 
			   side: THREE.DoubleSide, transparent: true, map:texture,roughness:0.2,envMap: envtex , alphaMap: alpmap, alphaTest:0.9} );
			   
			   if(texmap =="") {
					material.map = null; //hotfix for vertexcolors
					material.alphaMap = null;
				} else {
				   
					material.blending = THREE.CustomBlending;
					material.blendEquation = THREE.AddEquation; //default
					material.blendSrc = THREE.SrcAlphaFactor; //default
					material.blendDst = THREE.OneMinusSrcAlphaFactor; //default
				}
			  
			   var mat2 = material.clone(), mat3 = material.clone(), mat4 = material.clone();
			 mat2.envMap = null; mat2.roughness = 1.0;mat2: THREE.SmoothShading;
			  mat3.side = THREE.FrontSide;
			  mat4.roughness = 1.0; mat4.side = THREE.FrontSide;mat4.envMap = null;
			//   WebGLState.setBlending
				
				//append to textures
				
				
				loadedMaterials[modelSlot] = [material, mat2, mat3, mat4];
				material = loadedMaterials[modelSlot][matIdx]; //select the appropriate material
			//	console.log(matIdx +":" + loadedMaterials[matIdx].length - 1));
				
	} else {
				//Append already existant material
				material = loadedMaterials[modelSlot][matIdx]; //Re-Volt doesn't support shaders, so this works....
				//console.log(material.map);
	
	}
 
 
        mesh = new THREE.Mesh( geometry, material );
		
		/*if(mesh.children.length==0) {geometry = Array();mesh=Array();}*/
		/*else {*/scene.add( mesh );/*console.log(mesh);}*/
		
		//listOfMeshes[matIdx][modelSlot] = mesh;
		if(typeof onRenderFinish=="function") onRenderFinish(modelSlot);
		return mesh; //last position
	}
	
	function initLights() {
		
		
		scene.add( new THREE.AmbientLight( 0xffffff ) );
		scene.add( new THREE.AmbientLight( 0x999999 ) );
			/*var light1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
				light1.position.set( -1, 1, -1 );
				scene.add( light1 );*/
				/*var light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
				light2.position.set( 0, -1, 0.5 );
				scene.add( light2 );*/

		
		
		
		
		
		//renderer element
        renderer = new THREE.WebGLRenderer({alpha:true});
	    renderer.setSize( rendWidth, rendHeight );
		renderer.setClearColor( clearColor);
		
		//statistics
		stats = new Stats();
		
	    //append elements
		rendElement.appendChild( renderer.domElement );
		if(showFPS) rendElement.appendChild(stats.domElement);
    }
	
	function initControls() {
	//controls
		controls = new THREE.TrackballControls( camera );
		controls.enabled = true;
		controls.domElement = rendElement;
		controls.rollSpeed = Math.PI/24;
		controls.autoForward = false;
		controls.dragToLook = true;
		controls.rotateSpeed = 0.5;
		controls.zoomSpeed = 1.0;
		controls.panSpeed = 2.0;
		controls.enabled = true;
	
		controls.staticMoving = false;
		controls.dynamicDampingFactor = 0.4;/**/
		//controls.keys = [ 65, 83, 68 ];
		
		//
		
				var onKeyDown = function ( event ) {
					switch ( event.keyCode ) {
						case 38: // up
						case 87: // w 
						case 90: //z
							moveForward = true;
							break;
						case 37: // left
						case 65: // a
						case 81: // q
							moveLeft = true; break;
						case 40: // down
						case 83: // s
							moveBackward = true;
							break;
						case 39: // right
						case 68: // d
							moveRight = true;
							break;
					
					}
				};
				var onKeyUp = function ( event ) {
					switch( event.keyCode ) {
						case 38: // up
						case 87: // w
						case 90: //z
							moveForward = false;
							break;
						case 37: // left
						case 65: // a
						case 81: // q
							moveLeft = false;
							break;
						case 40: // down
						case 83: // s
							moveBackward = false;
							break;
						case 39: // right
						case 68: // d
							moveRight = false;
							break;
					}
				};
				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );
				rendElement.addEventListener('mousemove',function(e) {
				if (e.buttons==0)return;
					deltaTr = [e.clientX-mouseDownPos[0], e.clientY-mouseDownPos[1]];
					//console.log(deltaTr);
					mouseDownPos=[e.clientX,e.clientY];
					camera.rotation.y += deltaTr[0]*0.001 ;
					
					
				
				});
				rendElement.addEventListener('mousedown',function(e){mouseDownPos=[e.clientX,e.clientY]});
				
			//	scene.add(controls.getObject());
		}

    function animate() {
        requestAnimationFrame( animate );
		
        render();
    }

	var lastFrameTime=0,deltat=100;
    function render() {
	
		//get time delta, for spinner
		deltat = (Date.now() - lastFrameTime); 
		lastFrameTime = Date.now();
	
		deltat = deltat/100.0;
		
		
	
	
		velocity.x -= velocity.x * 1.0 *  deltat;
		velocity.z -= velocity.z * 1.0 *  deltat;
		velocity.y -= velocity.y * 1.0 *  deltat;
		
		
		
		if ( moveBackward ) velocity.z -= 300.0 * deltat;
		if ( moveForward ) velocity.z += 300.0 *  deltat;
		if ( moveRight ) velocity.x -= 300.0 *  deltat;
		if ( moveLeft ) velocity.x += 300.0 *  deltat;
		
		velocity.y += deltaTr[1];
		deltaTr=[0,0];
		
		//console.log("--");
		//console.log(velocity);
		//console.log(moveForward);
					
					
		//controls.getObject().translateX( velocity.x *  deltat);
		//controls.getObject().translateY( velocity.y *  deltat);
		//controls.getObject().translateZ( velocity.z *  deltat );
		
		theta=0.1;
		//save performance please
		if (Math.abs(velocity.x) < 1e-4)velocity.x=0;
		if (Math.abs(velocity.y) < 1e-4)velocity.y=0;
		if (Math.abs(velocity.z) < 1e-4)velocity.z=0;
		
		//and stability
		if (Math.abs(velocity.x) > 400)velocity.x=400*Math.sign(velocity.x);
		if (Math.abs(velocity.y) > 400)velocity.y=400*Math.sign(velocity.y);
		if (Math.abs(velocity.z) > 400)velocity.z=400*Math.sign(velocity.z);
	
			
			//console.log(velocity);
			camera.position.z -= deltat*( velocity.x * Math.sin(-camera.rotation.y) + velocity.z * Math.cos(camera.rotation.y))
			//camera.position.y += velocity.y *  deltat;
			camera.position.x -= deltat*( velocity.x * Math.cos(camera.rotation.y) +velocity.z * Math.sin(camera.rotation.y))
		
		
		
		
		//controls.movementSpeed = 0.33 * deltat/10000;
		//		controls.update( deltat );

		if (velocity.x ==0 && velocity.y==0 && velocity.z ==0) return;
		//console.log(velocity);
		raycasterDown.ray.origin.copy(camera.position);
		raycasterDown.ray.origin.y+=50;
		raycasterUp.ray.origin.copy(camera.position);
		raycasterUp.ray.origin.y+=50;
		var intersectsD = raycasterDown.intersectObjects( scene.children );
		var intersectsU = raycasterUp.intersectObjects( scene.children );
		
		var maxDist = -400;
		var minDist = 400;
		//console.log("start------");
	 	if( intersectsD.length>0) maxDist = Math.max(intersectsD[0].distance,maxDist);
	 	if( intersectsU.length>0) minDist = Math.min(intersectsU[0].distance,minDist);
		
		if( intersectsD.length>0 && intersectsD[0].distance <200) camera.position.y +=50;
		if( intersectsD.length>0 && intersectsD[0].distance >400) camera.position.y -=50;
		
		//for (intr = 0 ; intr < intersects.length; intr++)console.info(intersects[intr].distance);
		
			//maxDist = Math.min( maxDist, 500);
			//console.log("D:"+maxDist);
			//console.log("U:"+minDist);
			
		
		//if(maxDist!=0)camera.position.y += maxDist+50 ;
		
		
        renderer.render( scene, camera ); //update scene
		
	
		
		//update stats
			stats.update();

    }
	
