<html>
<body>
<script src="dist/three.js"></script>
<div style='width: 800px; height:600px;top:0px;bottom:0px' id='renderWindow'></div>


<script src="//jdataview.github.io/dist/jdataview.js"></script>
<!--<script src="//jdataview.github.io/dist/jbinary.js"></script>-->
<script src="dist/jquery-1.4.4-binary-ajax.js"></script>
<script src="dist/stats.min.js"></script>
<script src="dist/TrackballControls.js"></script>
<script src="dist/trackload.js"></script>
<script src="dist/identifyFileNames.js"></script>

<script>
//trackloadjsconfigure("renderWindow", true);
trackloadjsconfigure("window", true);
//carloadjsconfigure("renderWindow", 'rgb(128,192,255)', true);
initSceneAndCamera();
initLights();

//problems:
//var l = new paramsFile("./cars/BMW330i/parameters.txt"); //--matrix inverse problem, works (warning)
//var l = new paramsFile("./cars/rckallel2/parameters.txt"); //--error, trying to load inexistant stuffs
//var l = new paramsFile("./cars/microcasque/parameters.txt"); //--half transparency not supported yet
//var l = new paramsFile("./cars/ford_roadster_32/parameters.txt"); //-- trying to load NONE
var l = new levelFolder("./levels/<?php echo $_GET["name"] ?>/"); //--cross car test, pins and springs

initControls();
//passed:
//var l = new paramsFile("./cars/Toyeca/parameters.txt"); 
//var l = new paramsFile("./cars/AE86D/parameters.txt"); //-
//var l = new paramsFile("./cars/Thorax/parameters.txt"); //-- cross car test : "ok"
//var l = new paramsFile("./cars/tc5/parameters.txt"); //--softcar example, "ok"
//var l = new paramsFile("./cars/futari/parameters.txt"); //car with unusual body test, "ok"
//var l = new paramsFile("./cars/wincar2/parameters.txt"); //car with spinner test, "ok"
//var l = new paramsFile("./cars/rckallel/parameters.txt"); //--works

animate();
</script>

</body>
</html>