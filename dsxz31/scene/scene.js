// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +


  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +


  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Position2;\n' +
  'varying highp vec2 v_TexCoord;\n' +

  'uniform bool u_isLighting;\n' +

  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix *a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +

  '  if(u_isLighting)\n' + 
  '  {\n' +
  '  v_Position2 = vec3(u_ModelMatrix * a_Position);\n' +
 
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' + //this is also used for normal point lighting
  
'v_Color = a_Color;\n'+

  '  }else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_LightPosition2;\n' +  // Position of the light source
  'uniform bool u_UseTextures;\n' +

  'uniform sampler2D u_Sampler;\n' +

  'uniform vec3 u_AmbientLight;\n' +  
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying highp vec2 v_TexCoord;\n' +

  'varying vec4 v_TexColor;\n' +

  'void main() {\n' +
  // Normalize the normal because it is interpolated and not 1.0 in length any more
'  vec3 normal = normalize(v_Normal);\n' +
// '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

  // Calculate the light direction and make its length 1.
'  vec3 lightDirection = normalize(u_LightPosition+u_LightPosition2 - v_Position);\n' +
  // The dot product of the light direction and the orientation of a surface (the normal)
'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
'  vec4 color0 = texture2D(u_Sampler, v_TexCoord);\n' +

'vec4 fragColor = v_Color;\n'+
 ' if (u_UseTextures){\n' +
 '   fragColor = color0;\n'+
'  }else\n' +
 '  {\n' +
 '  }\n' + 
'  vec3 diffuse = u_LightColor *fragColor.rgb * nDotL;\n' +
'  vec3 ambient = u_AmbientLight * fragColor.rgb;\n' +

'  gl_FragColor = vec4(diffuse + ambient, fragColor.a);\n' +

  '}\n';

var modelMatrix = new Matrix4(); // The model matrix

var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var currentAngle = [0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degrees)
var tracking = 0;

var move = 0.8;
var fwdBack = 40;
var leftRight = 0;
var upDown = 0;
var piv = 0;
var lighting = true;
var fov = 35;
var then = 0;
var rotation =0.0;
var now = 0;
var movementX = 0.0;
var movementY = 0.0;

var birdX = 0;
var birdY = 2;
var birdZ = 5;
var dir = 1;
var dirY = 1;
var moveBird = true;

var moveKit = 0.15
var kitX = 4;
var kitY = 3;
var kitZ = 10;
var ang = 0.1;
var changeDir = false;
var kitDir = 1;
function main() {

  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.529, 0.807, 0.921, 1);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_LightPosition2 = gl.getUniformLocation(gl.program, 'u_LightPosition2');
  var u_AmbientLight= gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_Sampler= gl.getUniformLocation(gl.program, 'u_Sampler');
  //   var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
//var texcoordLocation = gl.getAttribLocation(gl.program, "a_TexCoord");

    // Trigger using lighting or not

  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 
  var u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures'); 

  

  var textures = []
  for (var i=0; i<=4; i++){
    temp = gl.createTexture();
    textures.push(temp);
  }

  if (!u_ModelMatrix || !u_ViewMatrix  || !u_NormalMatrix||!u_ProjMatrix  ||!u_AmbientLight ||!u_LightColor ||!u_LightPosition ||!u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }



//light colour to closely approximate colour of sun
// gl.uniform3f(u_LightColor, 0.976, 0.843, 0.109);
gl.uniform3f(u_LightColor,1,1,1);
//add a second light source to make it look better
gl.uniform3f(u_LightPosition2,3,5,6);
gl.uniform3f(u_LightPosition, 10, 5, 6);
gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
  // Set the light direction (in the world coordinate)
//   var lightDirection = new Vector3([0.5, 3.0, 4.0]);
//   lightDirection.normalize();     // Normalize
//   gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  
  projMatrix.setPerspective(fov, canvas.width/canvas.height, 1, 100);
  viewMatrix.setLookAt(leftRight, upDown, fwdBack, piv, 0, 0, 0, 1, 0);
//   currentAngle = animate(currentAngle);  // Update the rotation angle
  // Pass the model, view, and projection matrix to the uniform variable respectively
 gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  initEventHandlers(canvas);
  document.addEventListener("keydown", keydown, true); 
  // document.onkeydown = function(ev){
  //   keydown(ev);
  // };
  var funDraw = function(){
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    if (moveBird==true){
      birdX = movementX;
      birdY = movementY;
    }
    if (birdX>8.5||birdX<-8.5){
      dir = dir*(-1)
    }
    if (birdY>5||birdY<0){
      dirY = dirY*(-1)
    }

      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting,u_UseTextures,u_ViewMatrix,u_Sampler,textures,deltaTime);
      requestAnimationFrame(funDraw);
  }
  funDraw();
  //draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}
function initEventHandlers(canvas) {
  var dragging = false;         // Dragging or not
  var lastX = -1, lastY = -1;   // Last position of the mouse

  canvas.onmousedown = function(ev) {   // Mouse is pressed
    var x = ev.clientX, y = ev.clientY;
    // Start dragging if a moue is in <canvas>
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      dragging = true;
    }
  };

  canvas.onmouseup = function(ev) { dragging = false;  }; // Mouse is released

  canvas.onmousemove = function(ev) { // Mouse is moved
    var x = ev.clientX, y = ev.clientY;
    if (dragging) {
      var factor = 100/canvas.height; // The rotation ratio
      var dx = factor * (x - lastX);
      // g_xAngle = factor*(g_xAngle + ANGLE_STEP) % 360;
      var dy = factor * (y - lastY);
      // g_yAngle = factor*(g_yAngle + ANGLE_STEP) % 360;

      // Limit x-axis rotation angle to -90 to 90 degrees
      currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
      currentAngle[1] = currentAngle[1] + dx;
    }
    lastX = x, lastY = y;
  };
}


//draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);



function keydown(ev) {
  switch (ev.keyCode) {
    case 40: // Down arrow key 
    if (kitY-moveKit>0){
      kitY = kitY-moveKit
    }
      break;
    case 38: // Up arrow key 
      kitY = kitY+moveKit
    break;
    case 39: // Right arrow key -
    if (changeDir == false){
      kitDir = kitDir * (-1)
      }
    changeDir = true;
    kitX = kitX+moveKit
    
    break;
    case 37: // Left arrow key 
    if (changeDir == true){
      kitDir = kitDir * (-1)
    }
    changeDir = false;
    kitX = kitX-moveKit
    
    break;
    case 81: // Q key to rotate camera
      piv = (piv - 2.5*move);
      break;
    case 69: // E key to rotate camera
      piv = (piv + 2.5*move);
      break;
    case 87: // W for fwd
      fwdBack = (fwdBack - move) ;
      break;
    case 83: // S for back
     fwdBack = (fwdBack + move) ;
      break;
    case 68: // D for right
      leftRight = (leftRight + move);
      break;
    case 65: // A for left
    leftRight = (leftRight - move) ;
      break;
    case 85: // U for up
    upDown = (upDown + move) ;
      break;
    case 74: // j for down
    upDown = (upDown - move) ;
      break;
      case 84: // j for down
      if (tracking ==0){
        tracking = -100;
      }else{
        tracking = 0;
      }
      break;
    case 32: // j for down
    if (moveBird==true){
      moveBird =false;
    }else{
      moveBird = true;
    }
      break;
    case 76: // L key for lights
        if (lighting==true){
            lighting=false;

        }else{
            lighting=true;
        }
      break;
    default: return; // Skip drawing at no effective action
  }
}


function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
 ]);
 

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0
  ]);
  

  var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  var FSIZE = texCoords.BYTES_PER_ELEMENT;
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT,0,0)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT,FSIZE*6,FSIZE*3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT,FSIZE*2,0)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT,0,0)) return -1;
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 
  var texCoordBuffer = gl.createBuffer();
  if (!texCoordBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
  return indices.length;
}

function initVertexBuffersCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
 ]);
 

  var texCoords = new Float32Array([
    3.0, 3.0,   0.0, 3.0,   0.0, 0.0,   3.0, 0.0,
    0.0, 3.0,   0.0, 0.0,   3.0, 0.0,   3.0, 3.0,
    3.0, 0.0,   3.0, 3.0,   0.0, 3.0,   0.0, 0.0,
    3.0, 3.0,   0.0, 3.0,   0.0, 0.0,   3.0, 0.0,  
    0.0, 0.0,   3.0, 0.0,   3.0, 3.0,   0.0, 3.0,
    0.0, 0.0,   3.0, 0.0,   3.0, 3.0,   0.0, 3.0
  ]);

  var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  var FSIZE = texCoords.BYTES_PER_ELEMENT;
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT,0,0)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT,FSIZE*6,FSIZE*3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT,0,0)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT,0,0)) return -1;
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 
  var texCoordBuffer = gl.createBuffer();
  if (!texCoordBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
  return indices.length;
}

var images = [];
for (var i=0; i<=4; i++){
  var image = new Image();
  if (i ==0){
    imageName = './wall.jpg'
  }else if (i ==1){
    imageName = './grass.jpg'
  }else if (i ==2){
    imageName = './roof.png'
  }else if (i ==3){
    imageName = './window.jpg'
  }else if (i ==4){
    imageName = './door-1.jpg'
  }

  image.src = imageName;
  images.push(image);
}
var texCoords2 = new Float32Array([
  3.0, 3.0,   0.0, 3.0,   0.0, 0.0,   3.0, 0.0,
  0.0, 3.0,   0.0, 0.0,   3.0, 0.0,   3.0, 3.0,
  3.0, 0.0,   3.0, 3.0,   0.0, 3.0,   0.0, 0.0,
  3.0, 3.0,   0.0, 3.0,   0.0, 0.0,   3.0, 0.0,  
  0.0, 0.0,   3.0, 0.0,   3.0, 3.0,   0.0, 3.0,
  0.0, 0.0,   3.0, 0.0,   3.0, 3.0,   0.0, 3.0
]);
var texCoords = new Float32Array([
  1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,
  0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
  1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
  1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  
  0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
  0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0
]);

function changeTexture(gl,number,u_Sampler,textures,repeat){
  gl.uniform1i(u_Sampler, 0);
  image = images[number];

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,textures[number]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
//   if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//     // Yes, it's a power of 2. Generate mips.
//     gl.generateMipmap(gl.TEXTURE_2D);
//  } else {
    // No, it's not a power of 2. Turn of mips and set
    // wrapping to clamp to edge
    // gl.deleteBuffer(texCoordBuffer);
    if (repeat==true){
      // if (!initArrayBuffer(gl, 'a_TexCoord', texCoords2, 2, gl.FLOAT,8,0)) return -1;
      // var texCoordBuffer = gl.createBuffer();

      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texCoordBuffer);
      // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, texCoords2, gl.STATIC_DRAW);
      
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }else{
      // if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT,8,0)) return -1;
      // var texCoordBuffer = gl.createBuffer();

      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texCoordBuffer);
      // // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.generateMipmap(gl.TEXTURE_2D);
 } else { 
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

 }
    
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.);

//  }
  // gl.uniform1i(u_Sampler, 0);
  //gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

}
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}



function initVertexBuffersTree(gl) { // Create a tree
  var SPHERE_DIV = 3;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), 3,gl.FLOAT,0,0)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), 3,gl.FLOAT,0,0))  return -1;
  

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}
function initVertexBuffersCone(gl) {
        var vertices = new Float32Array([
          0, 0.5,   -0.5, -0.5,   0.5, -0.5
        ]);
        var n = 3; // The number of vertices
      
        // Create a WebGL buffer object (geometry data can be passed to and processed
        // by the vertex and fragment shaders only if they are stored in WebGL buffer
        // object at the first place)
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }
      
        // Bind the buffer object to target buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object (write once and used many times)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
          console.log('Failed to get the storage location of a_Position');
          return -1;
        }
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
      
        return n;
      }
      
  
function initArrayBuffer (gl, attribute, data, num, type,fs1,fs2) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  // gl.vertexAttribPointer(a_TexCoord, 4, gl.FLOAT, false, 0, FSIZE * 2);
  // gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  gl.vertexAttribPointer(a_attribute, num, type, false, fs1, fs2);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}


var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}


// 
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting,u_UseTextures, u_ViewMatrix, u_Sampler,textures,deltaTime) {

  // Clear color and depth buffer

if (lighting==true){
  gl.clearColor(0.529, 0.807, 0.921, 1);

}else{
  gl.clearColor(0,0,0.2,1);

}
  gl.uniform1i(u_UseTextures,true);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  changeTexture(gl,0,u_Sampler,textures,true);
    viewMatrix.setLookAt(leftRight, upDown, fwdBack, piv, 0, tracking, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // viewMatrix.rotate(g_yAngle,0,1,0);
    // viewMatrix.rotate(g_xAngle,1,0,0);
    
    viewMatrix.setTranslate(0,0,0);
    var n = initVertexBuffersCube(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

  // Calculate the view matrix and the projection matrix
  // modelMatrix.setTranslate(0, 0, 0);  // No Translation

  // Pass the model matrix to the uniform variable

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.uniform1i(u_isLighting, lighting); // Will apply lighting
  gl.uniform1i(u_UseTextures, true); // Will not apply lighting



  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(currentAngle[0], 1, 0, 0); // Rotate along y axis
  modelMatrix.rotate(currentAngle[1], 0, 1, 0); // Rotate along x axis

  // model for the right side  of the building
  changeColour(gl,0.86,0.86,0.76);
  pushMatrix(modelMatrix);
    modelMatrix.translate(5,-1.0,0)
    modelMatrix.scale(5, 3, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(11,-1.0,0)
    modelMatrix.rotate(90,0,1,0);
    modelMatrix.scale(7, 6, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-11,-1.0,0)
    modelMatrix.rotate(90,0,1,0);
    modelMatrix.scale(7, 6, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //model for the left side of the building
  pushMatrix(modelMatrix);
    modelMatrix.translate(-5,-1.0,0)
    modelMatrix.scale(5, 3, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

//model for the main part of the building
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0.25);  // Translation
    modelMatrix.scale(2.0, 5, 2.24); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  gl.uniform1i(u_UseTextures,false);

 // windows 
 


//floor/grass
gl.uniform1i(u_UseTextures, true); // Will not apply lighting

changeTexture(gl,1,u_Sampler,textures,true);
pushMatrix(modelMatrix);
changeColour(gl, 0.529,0.921,0.580);
modelMatrix.translate(-5,-7.1,-5);
modelMatrix.scale(50,5,50);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
 gl.uniform1i(u_UseTextures, false); // Will not apply lighting
 var n = initVertexBuffers(gl);
 if (n < 0) {
   console.log('Failed to set the vertex information');
   return;
 }
 gl.uniform1i(u_UseTextures,true);

 changeTexture(gl,3,u_Sampler,textures,false);
changeColour(gl,1,1,1);
pushMatrix(modelMatrix);
modelMatrix.translate(3.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(5.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(7.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


//side windows
pushMatrix(modelMatrix);
modelMatrix.translate(10, 0.65, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(12, 0.65, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-10, 0.65, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12, 0.65, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(10, 3.5, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(12, 3.5, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-10, 3.5, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12, 3.5, 0);  // Translation
modelMatrix.scale(0.5, 1, 7.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();



pushMatrix(modelMatrix);
modelMatrix.translate(11, 0.5, 4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(-11, 0.5, 4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(11, 0.5, -4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(-11, 0.5, -4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(11, 3.5, 4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(-11, 3.5, 4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(11, 3.5, -4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(-11, 3.5, -4.5);  // Translation
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(1, 1, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();



//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-3.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows

pushMatrix(modelMatrix);
modelMatrix.translate(-5.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-7.3, 0.65, 0);  // Translation
modelMatrix.scale(0.4, 0.65, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

// windows bottom row
pushMatrix(modelMatrix);
modelMatrix.translate(3.3, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(5.33, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(7.33, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-3.33, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-5.33, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-7.33, -1.0, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


//windows top (mid)
pushMatrix(modelMatrix);
modelMatrix.translate(0.75, 3, 0.25);  // Translation
modelMatrix.scale(0.5, 0.8, 2.35); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows top (mid)
pushMatrix(modelMatrix);
modelMatrix.translate(-0.75, 3, 0.25);  // Translation
modelMatrix.scale(0.5, 0.8, 2.35); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
gl.uniform1i(u_UseTextures,false);


//patio before stairs
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(0, -2, 2.3);  // Translation
modelMatrix.scale(1.999, 0.25, 2); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//stair 1
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(0, -2, 4.75);  // Translation
modelMatrix.scale(1.5, 0.2, 0.5); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


gl.uniform1i(u_UseTextures, true); // Will not apply lighting

changeTexture(gl,2,u_Sampler,textures,false);
//roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,3,1.0);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(11,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(12,6,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(7,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(10,6,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.rotate(45,1,0,0);
modelMatrix.scale(7,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12,6,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.rotate(45,1,0,0);
modelMatrix.scale(7,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-10,6,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(7,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


//back roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,3,-0.9);
modelMatrix.rotate(45,1,0,0);
modelMatrix.scale(11,1.4,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//top front roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,6.1,1.35);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(2,1.6,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//top back roof of buidling
pushMatrix(modelMatrix);
modelMatrix.translate(0,6.1,-1.0);
modelMatrix.rotate(45,1,0,0);
modelMatrix.scale(2,1.6,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
gl.uniform1i(u_UseTextures, false); // Will not apply lighting

//left leg of bird
pushMatrix(modelMatrix);
modelMatrix.translate(birdX-0.06,birdY-0.4,birdZ);
modelMatrix.scale(0.03,0.15,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//right leg of bird
pushMatrix(modelMatrix);
modelMatrix.translate(birdX+0.06,birdY-0.4,birdZ);
modelMatrix.scale(0.03,0.15,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//eyes of the bird
pushMatrix(modelMatrix);
changeColour(gl,0,0,0);
modelMatrix.translate(birdX+0.06,birdY+0.35,birdZ+0.17);
modelMatrix.scale(0.015,0.015,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(birdX-0.06,birdY+0.35,birdZ+0.17);
modelMatrix.scale(0.015,0.015,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(birdX,birdY+0.25,birdZ+0.13);
modelMatrix.scale(0.06,0.01,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

changeColour(gl,0,0,0);

//string of kite
pushMatrix(modelMatrix);
modelMatrix.translate(kitX+ang,kitY-0.9,kitZ);
modelMatrix.rotate(ang*100,0,0,1);
modelMatrix.scale(0.03,0.6,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(kitX+ang*3.5,kitY-1.85,kitZ);
modelMatrix.rotate(ang*170,0,0,1);
modelMatrix.scale(0.03,0.6,0.03);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//logs of trees outside
for (var i=-10; i<=10; i+=4){
    changeColour(gl,0.435, 0.274, 0.105);
    pushMatrix(modelMatrix);
        modelMatrix.translate(i, -1.7, 10);  // Translation
        modelMatrix.scale(0.25, 0.65, 0.25); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
}
//stair 2 (lower)
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(0, -2, 5.5);  // Translation
modelMatrix.scale(1, 0.1, 0.5); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//door
gl.uniform1i(u_UseTextures,true);
  changeTexture(gl,4,u_Sampler,textures,false);
pushMatrix(modelMatrix);
modelMatrix.translate(0, -0.5, 2.3);  // Translation
modelMatrix.scale(1, 1.3, 0.25); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

gl.uniform1i(u_UseTextures,false);

var n = initVertexBuffersCone(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //bird wings
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(birdX,birdY+0.1,birdZ);
modelMatrix.scale(0.8,0.5,0.5);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//bird nose
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(birdX,birdY+0.3,birdZ+0.2);
modelMatrix.rotate(180,0,0,1);
modelMatrix.rotate(20,1,0,0);

modelMatrix.scale(0.05,0.05,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


gl.uniform1i(u_UseTextures, true); // Will not apply lighting

changeTexture(gl,2,u_Sampler,textures,false);
//cover of side roof right
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(8.9,3,0);
modelMatrix.rotate(270,0,1,0);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(11,6,7);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(11,6,-7);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-11,6,7);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-11,6,-7);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();



//cover of side roof left
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(-8.9,3,0);
modelMatrix.rotate(270,0,1,0);
modelMatrix.scale(4,2,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//cover of top roof right
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(1.9,6.1,0.2);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4.5,2.3,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//cover of top roof left
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(-1.9,6.1,0.2);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4.5,2.3,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

gl.uniform1i(u_UseTextures, false); // Will not apply lighting

var n = initVertexBuffersTree(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  changeColour(gl, 0.529,0.921,0.580);
//tops of trees outside
  for (var i=-10; i<=10; i+=4){
    pushMatrix(modelMatrix);
        modelMatrix.translate(i,-0.6,10);
        modelMatrix.rotate(rotation,0,1,0);
        drawtree(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
}
//bird body
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(birdX,birdY,birdZ);
modelMatrix.scale(0.25, 0.4, 0.2); // Scale
drawtree(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//bird head
pushMatrix(modelMatrix);
changeColour(gl, 0.8,0.8,0.8);
modelMatrix.translate(birdX,birdY+0.33,birdZ+0.1);
modelMatrix.rotate(90,0,0,1);
modelMatrix.scale(0.15, 0.2, 0.15); // Scale
drawtree(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//kite
pushMatrix(modelMatrix);
changeColour(gl, 1,0.5,1);
modelMatrix.translate(kitX,kitY,kitZ);
modelMatrix.scale(0.25, 0.4, 0.1); // Scale
drawtree(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

if (moveBird){
movementX += dir*0.1+deltaTime;
movementY += dirY*0.1+deltaTime;
}
rotation +=1+deltaTime;

if (ang<0.25 && ang>-0.25){
  ang+=kitDir*0.005+deltaTime;
}else{
  if (ang>0){
    ang -=0.0001+deltaTime
  }else{
    ang +=0.0001+deltaTime

  }
}
 
}
function changeColour(gl,r,g,b){
    var colors = new Float32Array([    // Colors
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
        r, g, b,   r, g, b,   r, g, b,  r, g, b,    // v1-v6-v7-v2 left
        r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
        r, g, b,   r, g, b,   r, g, b,  r, g, b,　    // v4-v7-v6-v5 back
     ]);

     if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT,0,0)) return -1;

}
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}
function drawtree(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

  modelMatrix = popMatrix();
}