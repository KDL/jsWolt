/*****************************************************
	
	Car::load-JS by Kallel A.Y
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
/* Changelog:
		1.0 beta : code cleanup




*/

//entry
console.info("Car::Load.JS --------------------------------\n\
				version 1.0 beta							\n\
---------------------------------------------\n\
	\n\
	this software is licensed under MIT\n\
	Part of jsVolt (the Re-Volt file loader for Javascript)  and JsWolt (nVolt's WebGL implementation)\n\
	This preview is a property of Re-Volt fandom community and has no relation to Acclaim or WeGoInteractive whatsoever\n\
	\n\
	tool by Kallel A.Y\n\
.....................................................................");


//configuration
var rendElement = document.getElementById("renderWindow"); 
var clearColor = 'rgb(230,245,255)';
var rendWidth = rendElement.style.width.replace("px","");  
var rendHeight = rendElement.style.height.replace("px",""); 

//Dictionary of paths in parameters
//for instance, change every /cars/ to ./
//var dictOfPath = ["cars/","./"];
var dictOfPath = ["./","./"]; //cars are stored in cars/.../

var camera, scene, renderer, stats, showFPS;

//init ListOfMeshes, each mesh has 4 submeshes, each containing a different material
const MESH_COUNT = 4; //each mesh has 4 submeshes
var listOfMeshes=Array(MESH_COUNT); //contains a list of meshes
for (var i = 0 ;  i < MESH_COUNT ; i++) listOfMeshes[i] = Array(22);

//TODO: fix the alpha or warn it (or UPGRADE TO r83)
//TODO: pin, envMap Coloring
//TODO: primitve rendering


//Some constants
const POLY_QUAD = 1;
const POLY_DBLSD = 2;
const POLY_TRANSL = 4;
const POLY_TRANS = 256;
const POLY_ENVOFF = 1024; 
//const POLY_ENVON = 2048; //reserved for World

//Data structures
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
	var mbody = {modelNum: -1, offset: [0,0,0]};
	var mwheels = new Array(4); //{modelNum = -1, offset1 = [0,0,0], offset2=[0,0,0], isPresent =true};
	var mspring = new Array(4); //{modelNum = -1, offset = [0,0,0], length=0.0};
	var mpin = new Array(4); //{modelNum = -1, offset = [0,0,0], length=0.0};
	var maxle = new Array(4); //{modelNum = -1, offset = [0,0,0], length=0.0};
	var mspinner = {modelNum: -1, offset: [0,0,0], axis: new THREE.Vector3(0,0,0), angvel: 0.0}; //opt: axis is now vector3 instead of array
	var maerial = {ModelNumTop: -1, ModelNumBottom: -1, offset: [0,0,0], direction: [0,0,0], length:0.0};

	//visual items
	var body,wheels=Array(4),spring=Array(4),pin=Array(4),axle=Array(4),spinner=Array(4),aerial; //visual parts


	
/// configuration
function carloadjsconfigure(whereToRenderID,ClearColor,ShowFPS)
 {
 /* params:
	whereToRenderID: ID of the frame, it can be "window"
	ClearColor: CSS code for color
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
		
		 clearColor = ClearColor;
		 showFPS = ShowFPS;
 }



//The man entry, allows the loading & the rendering of the whole car
var paramsFile = function(path,onFinish) {
/*params:
		path: path to parameters.txt (full path)
		onFinish: Function to execute when the loading is finished
*/

	var models=new Array(22);
	var tpage = "";
	var envRGB = [255,255,255];
	var curMode = 0; //Main(0), body(1),
	var curIdx = 0; //Index of the mode, like 0 in WHEEL 0 
	

	var oReq = new XMLHttpRequest();
	oReq.open("GET", path,true);
	oReq.overrideMimeType("text/plain; charset=x-user-defined");
	oReq.onload = function (oEvent) {
		var textRead = oReq.responseText; 
		var key = "", secondKey="", Argument="",secondArgument;
		var lines = textRead.replace("}","}\n").replace("{","{\n").split('\r'); //make sure a new line is always there, then split
		while (lines.length > 0) {
			textRead = lines[0].split(";")[0].replace("\t"," ").trim(); //get the line
			lines.splice(0,1);											//remove line
			if ((textRead.length <= 2 && textRead!="}") || textRead.indexOf(" ")==-1) continue;		//can be read
			
			key = textRead.split(/\s+/)[0].toUpperCase();
			secondKey = textRead.split(/\s+/)[1];
			Argument = textRead.split(/\s+/)[2];
			if(Argument!="")secondArgument = textRead.split(/\s+/)[3];
			
			//console.log("CurMode : " + curMode);
			//console.log(key + ":"   + secondKey + ":" + Argument+ ":" + secondArgument);
				//Do we witness a mode change?
				switch(key) {
					case '}'	: curMode = 0; continue;break;
					case 'BODY' : curMode = 1;continue;break;
					case 'WHEEL': curMode = 2;curIdx = secondKey; mwheels[curIdx] = initV(0);  continue;break;
					case 'SPRING': curMode = 3;curIdx = secondKey; mspring[curIdx] = initV(1);continue; break;
					case 'PIN'	:curMode = 4;curIdx = secondKey; mpin[curIdx] = initV(1);  continue;break;
					case 'AXLE'	:curMode = 5;curIdx = secondKey; maxle[curIdx] = initV(1); continue; break;
					case 'SPINNER'	:curMode = 6; continue;break;
					case 'AERIAL'	:curMode = 7;continue; break;
				}
				
				
				if (curMode == 0)//Main Mode 
				switch(key) {
					case 'MODEL': models[secondKey] = Argument.replace("\"","").replace(/\\/g,"/").replace(dictOfPath[0],dictOfPath[1]).replace(/\"/g,"");break;
					case 'TPAGE': tpage = secondKey.replace("\"","").replace(/\\/g,"/").replace(dictOfPath[0],dictOfPath[1]).replace(/\"/g,"");break;
					case 'ENVRGB' : envRGB = [Math.ceil(secondKey),Math.ceil(Argument),Math.ceil(secondArgument)];break;
				}
				else if (curMode == 1) //body
				switch(key) {
					case 'MODELNUM': mbody.modelNum = Math.ceil(secondKey);break;
					case 'OFFSET': mbody.offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
				}
				else if (curMode == 2) //wheels
				switch(key) {
					case 'MODELNUM': mwheels[curIdx].modelNum = Math.ceil(secondKey);break;
					case 'OFFSET1': mwheels[curIdx].offset1 =[parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'OFFSET2': mwheels[curIdx].offset2 = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'ISPRESENT': mwheels[curIdx].isPresent = (secondKey.toLowerCase()=="true");break;
				}
				else if (curMode == 3) //spring
				switch(key) {
					case 'MODELNUM': mspring[curIdx].modelNum = Math.ceil(secondKey);break;
					case 'OFFSET': mspring[curIdx].offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'LENGTH': mspring[curIdx].length = parseFloat(secondKey);break;
				}
				else if (curMode == 4) //pin
				switch(key) {
					case 'MODELNUM': mpin[curIdx].modelNum = Math.ceil(secondKey);break;
					case 'OFFSET': mpin[curIdx].offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'LENGTH': mpin[curIdx].length = parseFloat(secondKey);break;
				}
				else if (curMode == 5) //axle
				switch(key) {
					case 'MODELNUM': maxle[curIdx].modelNum = Math.ceil(secondKey);break;
					case 'OFFSET': maxle[curIdx].offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'LENGTH': maxle[curIdx].length = parseFloat(secondKey);break;
				}
				else if (curMode == 6) //spinner
				switch(key) {
					case 'MODELNUM': mspinner.modelNum = Math.ceil(secondKey);break;
					case 'OFFSET': mspinner.offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'AXIS': mspinner.axis = new THREE.Vector3(-parseFloat(secondKey),-parseFloat(Argument),parseFloat(secondArgument));break; //HACK
					case 'ANGVEL': mspinner.angvel = parseFloat(secondKey);break;
				}
				else if (curMode == 7) //aerial
				switch(key) {
					case 'SECMODELNUM': maerial.ModelNumTop = secondKey;break;
					case 'TOPMODELNUM': maerial.ModelNumBottom = secondKey;break;
					case 'OFFSET': maerial.offset = [parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'DIRECTION':maerial.direction =[parseFloat(secondKey),parseFloat(Argument),parseFloat(secondArgument)];break;
					case 'LENGTH': maerial.length = parseFloat(secondKey);break;
				}
		} //reading
		
		//console.log(mbody);
		//console.log(mwheels);
		//console.log(mspring);
		//console.log(mpin);
		//console.log(maxle);
		//console.log(mspinner);
		//console.log(maerial);
				//variables!! temporary ones!
				var tmp,foo,bar,t;
	
			
				//load & render the body [slot : 0]
				if(mbody.modelNum!=-1) body = new jsvModel(models[mbody.modelNum],tpage,envRGB, 0, function(renderSlot) {
				
				for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
							if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
							listOfMeshes[iMesh][renderSlot].position.x = -mbody.offset[0];
							listOfMeshes[iMesh][renderSlot].position.y = -mbody.offset[1];
							listOfMeshes[iMesh][renderSlot].position.z = mbody.offset[2];
						}
			
			});
			
				
				//load & render the wheels [slots: 1-4]
				for(var i=0;i<4;i++) {
				if(mwheels[i].modelNum!=-1 && mwheels[i].isPresent)  {
					wheels[i] = new jsvModel(models[mwheels[i].modelNum],tpage,envRGB,	i+1, function(renderSlot) {
					
						for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
						if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
							listOfMeshes[iMesh][renderSlot].position.x = -mwheels[renderSlot-1].offset1[0];
							listOfMeshes[iMesh][renderSlot].position.y = -mwheels[renderSlot-1].offset1[1];
							listOfMeshes[iMesh][renderSlot].position.z = mwheels[renderSlot-1].offset1[2];
						}
						
				 });
				}
				//}
			
				//load & render the springs [slots: 5-9]			
				//for(var i=0;i<4;i++) {
				if(mspring[i].modelNum!=-1)  {
					spring[i] = new jsvModel(models[mspring[i].modelNum],tpage,envRGB,	i+5, function(renderSlot) {
							//TODO: put it into matrix!!!!
							
							 //get scale
							 t = diffLeng(mspring[renderSlot-5].offset, mwheels[renderSlot-5].offset1) / mspring[renderSlot-5].length;
							
							//construct LookDownMatrix
							bar = new THREE.Matrix4();
							tmp = arr2vec(mwheels[renderSlot-5].offset1);
							foo = arr2vec(mspring[renderSlot-5].offset);
							bar = bar.lookAt ( foo, tmp, new THREE.Vector3(0,0,-1) );
							
							for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
								if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
								
								
								listOfMeshes[iMesh][renderSlot].applyMatrix(listOfMeshes[iMesh][renderSlot].matrix.scale(new THREE.Vector3(1,t,1)).multiply(bar));

								//translate
								listOfMeshes[iMesh][renderSlot].position.x = -mspring[renderSlot-5].offset[0];
								listOfMeshes[iMesh][renderSlot].position.y = -mspring[renderSlot-5].offset[1];
								listOfMeshes[iMesh][renderSlot].position.z = mspring[renderSlot-5].offset[2];
							}
							
				 });
				}
				//}
			
			
				//load & render the pins [slots: 10-14]
				//for(var i=0;i<4;i++) {
				if(mpin[i].modelNum!=-1 )  {
					pin[i] = new jsvModel(models[mpin[i].modelNum],tpage,envRGB,	i+10, function(renderSlot) {
					 
						/*	
								//get scale
						//	= -mpin[renderSlot-10].length;
							listOfMeshes[renderSlot].scale.y =-mpin[renderSlot-10].length;
							 
							//construct LookDownMatrix
							bar = new THREE.Matrix4();
							tmp = arr2vec(mwheels[renderSlot-10].offset1);
							foo = arr2vec(mspring[renderSlot-10].offset);
							bar = bar.lookAt ( foo, tmp, new THREE.Vector3(0,0,-1) );
							bar = listOfMeshes[renderSlot].matrix.multiply(bar);
							listOfMeshes[renderSlot].applyMatrix(bar);
							
							//listOfMeshes[renderSlot].lookAt(mwheels[renderSlot-10].offset1);
							
							listOfMeshes[renderSlot].position.x = (-mspring[renderSlot-10].offset[0]);
							listOfMeshes[renderSlot].position.y =(-mspring[renderSlot-10].offset[1]);
							listOfMeshes[renderSlot].position.z = (+mspring[renderSlot-10].offset[2]);*/
							
							 //get scale
							 t =  -mpin[renderSlot-10].length;
							
							//construct LookDownMatrix
							bar = new THREE.Matrix4();
							tmp = arr2vec(mwheels[renderSlot-10].offset1);
							foo = arr2vec(mspring[renderSlot-10].offset);
							bar = bar.lookAt (foo,tmp, new THREE.Vector3(0,0,-1) );
						//	bar =  new THREE.Matrix4().makeScale(1,-t,1).multiply(bar);
							/*bar.elements[1]*=t;
							bar.elements[5]*=t;
							bar.elements[9]*=t;*/
							
							for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
								if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
								//listOfMeshes[iMesh][renderSlot].scale.y = t;
								listOfMeshes[iMesh][renderSlot].applyMatrix(listOfMeshes[iMesh][renderSlot].matrix.makeScale(1,t,1) );
								listOfMeshes[iMesh][renderSlot].applyMatrix(listOfMeshes[iMesh][renderSlot].matrix.multiply(bar) );
								//listOfMeshes[renderSlot].rotateZ(3.14159);
							
							
								//translate
								listOfMeshes[iMesh][renderSlot].position.x = -mwheels[renderSlot-10].offset1[0];
								listOfMeshes[iMesh][renderSlot].position.y = -mwheels[renderSlot-10].offset1[1];
								listOfMeshes[iMesh][renderSlot].position.z = mspring[renderSlot-10].offset[2];
							}
							
							
							/*     'load PINs (Car::Load engine) 
        For i = 0 To 3
            If cars(Active_Car).Theory.PIN(i).modelNumber <> -1 Then
                'If _Pin(i) IsNot Nothing Then
                cars(Active_Car).models.Pin(i) = New PRM(RVPATH & "\" & cars(Active_Car).Theory.MainInfos.Model(cars(Active_Car).Theory.PIN(i).modelNumber).Replace(Chr(34), ""))
                cars(Active_Car).models.Pin(i).TextureI = 1

                cars(Active_Car).models.Pin(i).MATRIX = Matrix4.Scale(1, -cars(Active_Car).Theory.PIN(i).Length, 1)

                cars(Active_Car).models.Pin(i).MATRIX *= BuildLookMatrixDown( _
                         cars(Active_Car).Theory.wheel(i).Offset(1) * Zoom, _
                         cars(Active_Car).Theory.PIN(i).offSet * Zoom + cars(Active_Car).Theory.Spring(i).Offset * Zoom)

                cars(Active_Car).models.Pin(i).MATRIX *= Matrix4.CreateTranslation(cars(Active_Car).Theory.PIN(i).offSet * Zoom + cars(Active_Car).Theory.Spring(i).Offset * Zoom / 2)




                'End If
            End If
        Next
*/
				 });
				}
				//}
			
			
				//load & render the axles [slots: 15-19]
				//for(var i=0;i<4;i++) {
				if(maxle[i].modelNum!=-1)  {
					axle[i] = new jsvModel(models[maxle[i].modelNum],tpage,envRGB,	i+15, function(renderSlot) {
							
						 //get scale
							t = diffLeng(maxle[renderSlot-15].offset, mwheels[renderSlot-15].offset1) / maxle[renderSlot-15].length;
							//listOfMeshes[renderSlot].scale.z = tmp;
							
							
							//construct LookDownMatrix
							bar = new THREE.Matrix4();
							tmp = arr2vecNeg(mwheels[renderSlot-15].offset1);
							foo = arr2vecNeg(maxle[renderSlot-15].offset);
							bar = bar.lookAt ( tmp, foo, new THREE.Vector3(0,1,0) );
						////	console.log(listOfMeshes[renderSlot].matrix.scale(new THREE.Vector3(tmp,1,1)));
							bar = new THREE.Matrix4().makeScale(1,1,t).multiply(bar);
							
							
							for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
								if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
								listOfMeshes[iMesh][renderSlot].applyMatrix(bar);
								
								//translate
								listOfMeshes[iMesh][renderSlot].position.x = -maxle[renderSlot-15].offset[0];
								listOfMeshes[iMesh][renderSlot].position.y = -maxle[renderSlot-15].offset[1];
								listOfMeshes[iMesh][renderSlot].position.z = maxle[renderSlot-15].offset[2];	
							}
							
             
              
				 });
				}
				}
				
				//load & render the spinner [slot: 20]
				if(mspinner.modelNum!=-1)  {
					spinner = new jsvModel(models[mspinner.modelNum],tpage,envRGB,	20, function(renderSlot) {
					
						for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
							if(listOfMeshes[iMesh][renderSlot] ==undefined) continue;
							listOfMeshes[iMesh][renderSlot].position.x = -mspinner.offset[0];
							listOfMeshes[iMesh][renderSlot].position.y = -mspinner.offset[1];
							listOfMeshes[iMesh][renderSlot].position.z = mspinner.offset[2];
						}
						
				 });
				}
				
					
				//load & render the aerial [slot: 21&22]
				if(maerial.ModelNumTop!=-1)  {
					console.log(models[maerial.ModelNumTop]);
					console.log(maerial);
					aerial = new jsvModel(models[maerial.ModelNumTop],"./cars/misc/fxpage1.bmp",envRGB,	21, function(renderSlot) {
					
					for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
							if (listOfMeshes[iMesh][renderSlot]==undefined) continue;
							listOfMeshes[iMesh][renderSlot].scale.y = maerial.length*(1+0.75*3);
							listOfMeshes[iMesh][renderSlot].position.x = -maerial.offset[0];
							listOfMeshes[iMesh][renderSlot].position.y = -maerial.offset[1];
							listOfMeshes[iMesh][renderSlot].position.z = maerial.offset[2];
						}
						//listOfMeshes[iMesh][renderSlot].geometry.
						
						//si la tige est rendue, on ajoute le dernier tronc
						if(maerial.ModelNumBottom!=-1)  {
							aerial2 = new jsvModel(models[maerial.ModelNumBottom],"./cars/misc/fxpage1.bmp",envRGB,	22, function(renderSlot) {
									//TODO: erm.... take care of custom aerials!!!!!
									
									var posY = listOfMeshes[3][21].getWorldPosition().y + listOfMeshes[3][21].getWorldScale().y;
								for (iMesh = 0; iMesh < MESH_COUNT; iMesh++) {
										if (listOfMeshes[iMesh][renderSlot]==undefined) continue;
										listOfMeshes[iMesh][renderSlot].scale.y = -maerial.length*0.75 ;//(1+0.75*4);
										listOfMeshes[iMesh][renderSlot].position.x = -maerial.offset[0];
										listOfMeshes[iMesh][renderSlot].position.y = posY;
										listOfMeshes[iMesh][renderSlot].position.z = maerial.offset[2];
									}
						
							 });
							}
			
				 });
				}
				
				if (onFinish!=undefined) if(typeof onFinish == "function") onFinish();
		
		}
	oReq.send(null);
}


////// load & render a Re-Volt model file
var jsvModel = function(path,texmap,envrgb,slot,onRenderFinish) {
/* Params:
	path: path of the model file
	texmap: path of the texture
	envRGB: Array(3) of color , in bytes
	slot  : The index of "listOfMeshes" that will be assigned to this model
	onRenderFinish: Function to execute when it's loaded & sent to GPU

*/

	//List of 
	//var QdTexPolies= [], QdPrimPolies= [], TriTexPolies= [], TriPrimPolies= []; //split them... just like Re-Volt
	var QdTexEnvDblsd = [], QdTexDblsd = [], QdTexEnv = [], QdTex = [], TriTexEnvDblsd = [], TriTexDblsd = [], TriTexEnv = [], TriTex = [];
	var vertices = [];


	//controls
	var controls;
	
	var visIdxList = [];
	var visVxPosList =  [];
	var visVxNorList =  [];
	var visVxColorList = [];
	var visVxUVList =  [];




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
	
	
		var view = new jDataView(oReq.response); //create new "binary reader"
		var npoly = view.getInt16(offset,1); offset+=2; //get npoly
		var nvec =  view.getInt16(offset,1); offset+=2; //get nvec
		
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
			
			if (p.tpage != -1 )  {//for PRM in cars, we ignore the tpage.... lol
			
			
			if(slot == 0) {	
				if (p.flag & POLY_QUAD) { //quad
					console.info(p.flag );
					 if (p.flag & POLY_DBLSD && p.flag & POLY_ENVOFF) QdTexDblsd.push(p);
					else if (p.flag & POLY_DBLSD) QdTexEnvDblsd.push(p);
					else if (p.flag & POLY_ENVOFF) QdTex.push(p);
					else QdTexEnv.push(p);
				
				} else { // tri
				
					 if (p.flag & POLY_DBLSD && p.flag & POLY_ENVOFF)TriTexDblsd.push(p);
					else if (p.flag & POLY_DBLSD) TriTexEnvDblsd.push(p);
					else if (p.flag & POLY_ENVOFF) TriTex.push(p);
					else TriTexEnv.push(p);
				
				}
			} else { //other than slot 0
				if (p.flag & POLY_QUAD) { //quad
					
					 if ((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVOFF)) QdTexEnvDblsd.push(p);
					else if (p.flag & POLY_DBLSD) QdTexDblsd.push(p);
					else if (p.flag & POLY_ENVOFF) QdTexEnv.push(p);
					else QdTex.push(p);
				
				} else { // tri
				
					 if ((p.flag & POLY_DBLSD) && (p.flag & POLY_ENVOFF))TriTexEnvDblsd.push(p);
					else if (p.flag & POLY_DBLSD)TriTexDblsd.push(p);
					else if (p.flag & POLY_ENVOFF) TriTexEnv.push(p);
					else TriTex.push(p);
				
				}
			
			
			}
				
		
			} else {
				console.error(" Primitive non-texture meshes are here!!!! (NOT_IMPLEMENTED)");
			}
			
		/*	if (p.tpage == -1 && (p.flag & 1)) QdPrimPolies.push(p);
			else if (p.tpage != -1 && (p.flag & 1)) QdTexPolies.push(p);
			else if (p.tpage == -1) TriPrimPolies.push(p);
			else TriTexPolies.push(p);*/
		}
		
		
				console.log("This mesh has " + QdTexEnvDblsd.length  + " qdTexEnvDblsd," + QdTexEnv.length  + " qdTexEnv," + QdTexDblsd.length  + " qdTexDblsd," + QdTex.length  + " qdTex  \n\
			  " + TriTexEnvDblsd.length  + " TriTexEnvDblsd," + TriTexEnv.length  + " TriTexEnv," + TriTexDblsd.length  + " TriTexDblsd," + TriTex.length  + " TriTex" );
			
			
			//load each vertex
		for (var i = 0 ; i < nvec ; i++) {
			var v = new vertex();
			//visVxListPos.push(view.getFloat32(offset,1),view.getFloat32(offset,1)*-1,view.getFloat32(offset,1)); offset+=12; 
			v.position  = [-view.getFloat32(offset,1),-view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
			//visVxListNor.push(view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)); offset +=12;
			v.normal  = [view.getFloat32(offset,1),view.getFloat32(offset+4,1),view.getFloat32(offset+8,1)];offset+=12; 
			vertices.push(v);
			
		}
		
		view = []; //remove all the view
		
	
	//------------------------------------ step 2, rendering
	
	//treat Textured elements
	var ply = 0;
	//X=fillVisualBuckets (TriTex,QdTex,vertices);
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	//addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,3,0);
	
	
	//[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTex,QdTex,vertices);
	X=fillVisualBuckets (TriTex,QdTex,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,3,0);
	X=fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,2,0);
	X=fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,1,0);
	X=fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(X[1],X[2],X[0],X[4],X[3],texmap,envrgb,slot,0,onRenderFinish);
	
	
	
	/*[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnv,QdTexEnv,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,2,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexDblsd,QdTexDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,1,0);
	[visIdxList ,visVxPosList ,visVxNorList, visVxColorList ,visVxUVList] = fillVisualBuckets (TriTexEnvDblsd,QdTexEnvDblsd,vertices);
	addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,slot,0,onRenderFinish);*/
	
	
	
};
this.meshIdx = slot;
/*this.render = function() {this.meshIdx = addPoliesTex(visVxPosList,visVxNorList,visIdxList,visVxUVList,visVxColorList,texmap,envrgb,onRenderFinish)};*/

this.Ready = 0;
oReq.send(null); //send request
}

 function fillVisualBuckets (TriTexPolies,QdTexPolies,vertices) {
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


	
   /* init();
    animate();*/

    function initSceneAndCamera() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, rendWidth / rendHeight, 1, 10000 );
        camera.position.z = 150;
        camera.position.y = 80;
        camera.position.x = 100;
	}
	
	 var envtex; //global variables, TODO: put them into a list
	  
	  
	  var loadedTextures = [];
	  var loadedMaterials= Array(MESH_COUNT);
	  for(i=0;i<MESH_COUNT;i++) loadedMaterials[i]= Array(); //init materials list
	  var canvas = [];
	  
	  
	function addPoliesTex(visVxListPos,visVxListNor,visIdxList,visUVList,visColorList,texmap,envrgb,modelSlot,matIdx,onRenderFinish) {	  
	 var geometry =  new THREE.BufferGeometry();
	  if(visVxListPos.length==0) {
			if(typeof onRenderFinish=="function") onRenderFinish(modelSlot);
			return -1;
		}
	  geometry.addAttribute( 'position', new THREE.BufferAttribute( visVxListPos, 3 ));
	  geometry.addAttribute( 'normal', new THREE.BufferAttribute( visVxListNor, 3 , true));
	  geometry.addAttribute( 'color', new THREE.BufferAttribute( visColorList, 3, true ));
	   geometry.addAttribute( 'uv', new THREE.BufferAttribute( visUVList, 2, true ));
	  geometry.setIndex( new THREE.BufferAttribute(   visIdxList, 1 ) );
	  geometry.computeBoundingBox();
	  
	  var mat; //material
	  
	 // console.log(texmap +":" + loadedTextures + "Index : " + loadedTextures.indexOf(texmap));
	  
	  //Append texture (and material)
	  if (loadedTextures.indexOf(texmap) == -1) {//only create texture when it's new
			
			   
			   var texture = new THREE.TextureLoader().load( texmap , function ( texture ) {
				
					var tname = texture.image.src.split("/")[texture.image.src.split("/").length-1];
					
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
					  
					  for (var c = 0; c < loadedTextures.length; c++)
					if(loadedTextures[c].indexOf(tname)!=-1) {
						for(j=0; j < MESH_COUNT; j++) {
							loadedMaterials[j][c].alphaMap = new THREE.CanvasTexture( canvas , THREE.UVMapping );
							loadedMaterials[j][c].alphaMap.needsUpdate = true;
							}
					}
					// loadedMaterials[0]
		});
			   texture.premultiplyAlpha = false;
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
				   
				   //MeshStandardMaterial
			   material = new THREE.MeshPhysicalMaterial( { color:'rgb('+envrgb.join(',')+')',  vertexColors: THREE.VertexColors, 
			   side: THREE.DoubleSide, transparent: true, map:texture,metalness: .5, roughness:0.1,envMap: envtex, alphaMap: alpmap, alphaTest:0.1, envMapIntensity:0.8, opacity:0.999} );
			   
			    material.blending = THREE.CustomBlending;
				material.blendEquation = THREE.AddEquation; //default
				material.blendSrc = THREE.SrcAlphaFactor; //default
				material.blendDst = THREE.OneMinusSrcAlphaFactor; //default
			  
	
			  
			   var mat2 = material.clone(), mat3 = material.clone(), mat4 = material.clone();
			 mat2.envMap = null; mat2.roughness = 1.0;mat2: THREE.SmoothShading;
			  mat3.side = THREE.FrontSide;
			  mat4.roughness = 1.0; mat4.side = THREE.FrontSide;mat4.envMapIntensity = 0;
			//   WebGLState.setBlending
				
				//append to textures
				loadedTextures.push(texmap);
				
				loadedMaterials[0].push(material);
				loadedMaterials[1].push(mat2);
				loadedMaterials[2].push(mat3);
				loadedMaterials[3].push(mat4);
				mat = loadedMaterials[matIdx][loadedMaterials[matIdx].length - 1]; //select the appropriate material
			//	console.log(matIdx +":" + loadedMaterials[matIdx].length - 1));
				
	} else {
				//Append already existant material
				mat = loadedMaterials[matIdx][loadedTextures.indexOf(texmap)]; //Re-Volt doesn't support shaders, so this works....
				console.log(matIdx +":" + loadedTextures.indexOf(texmap));
	
	
	}
 
		console.log(mat);
 
        var mesh = new THREE.Mesh( geometry, mat );
        scene.add( mesh );
		listOfMeshes[matIdx][modelSlot] = mesh;
		if(typeof onRenderFinish=="function") onRenderFinish(modelSlot);
		return modelSlot; //last position
	}
	
	function initLightsAndControl() {
		
		
			scene.add( new THREE.AmbientLight( 0xffffff ) );
			/*var light1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
				light1.position.set( -1, 1, -1 );
				scene.add( light1 );*/
				var light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
				light2.position.set( 0, -1, 0.5 );
				scene.add( light2 );

		//controls
		controls = new THREE.OrbitControls( camera );
		controls.rotateSpeed = 0.5;
		controls.zoomSpeed = 1.0;
		controls.panSpeed = 0.0;
		controls.noZoom = false;
		controls.noPan = true;
		controls.staticMoving = false;
		controls.dynamicDampingFactor = 0.4;
		controls.keys = [ 65, 83, 68 ];
		//controls.addEventListener( 'change', render );
		
		
		
		
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

    function animate() {
        requestAnimationFrame( animate );
		controls.update();
        render();
    }

	var lastFrameTime=0,deltat=0;
    function render() {
        renderer.render( scene, camera ); //update scene
		
		//get time delta, for spinner
		var deltat = (Date.now() - lastFrameTime); 
		lastFrameTime = Date.now();
	
	
		//update spinner
		//TODO: spinner
		if (mspinner.modelNum != -1) for(j=0; j < MESH_COUNT; j++)
		if (listOfMeshes[j][20]!=undefined && deltat!=0) { //animate the spinner, slot 20
			listOfMeshes[j][20].rotateOnAxis(mspinner.axis,mspinner.angvel/deltat);
			//console.log(mspinner.angvel*1.0/deltat);
		}
		
		//update stats
			stats.update();

    }
	
