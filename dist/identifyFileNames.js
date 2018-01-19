
var FIN_DICT_key=Array();
var FIN_DICT_val = Array();

var WHERE_TO_FIND_FILENAMES = "{track}"; //directly in track



function getRealPRMName(fileName,instanceIdx,whatToDoNow) {

	
	if (FIN_DICT_key.length==0) {
		var q = WHERE_TO_FIND_FILENAMES.replace("{track}",trackPath);
		// Load the dictionary of FIN
		var oReq = new XMLHttpRequest();
		oReq.open("GET", q, true);
		oReq.overrideMimeType("text/plain; charset=x-user-defined");
		
		//Once the request is "ordered", get response
		oReq.onload = function (oEvent) {
			var offset = 0;
			////console.log(oEvent);
			//console.log(oReq.responseText);
			//var r = oReq.responseText.toString().match(/\w+\.\w+/g);
			var r = oReq.responseText.toString().match(/\w+\.\P\R\M+/gi);
			for (item in r) {
				FIN_DICT_val.push(r[item]);
				FIN_DICT_key.push(r[item].toString().toUpperCase().substr(0,8).match(/[a-zA-Z0-9_]+/g)[0]);
			}
			//console.log(FIN_DICT_val);
			//console.log(FIN_DICT_key);
			
			var idx = FIN_DICT_key.indexOf(fileName.trim().match(/[a-zA-Z0-9_]+/g)[0] );
			
			if(idx!=-1)whatToDoNow(FIN_DICT_val[idx],instanceIdx);
			else whatToDoNow(-1,0);
			
		
		}
		
		oReq.send(null);
	} else {
		var idx = FIN_DICT_key.indexOf(fileName.trim().match(/[a-zA-Z0-9_]+/g)[0] );
		if(idx!=-1)whatToDoNow(FIN_DICT_val[idx],instanceIdx);
			else whatToDoNow(-1,0);
			
	}

	



}

//Currently, we load using file 


//path = path.replace("nhood1.fin","NHood1.fin");
