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
//   'uniform vec3 u_LightColor;\n' +     // Light color
//   'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Position2;\n' +
  'varying vec2 v_TexCoord;\n' +

  'uniform bool u_isLighting;\n' +

  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix *a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '  v_Position2 = vec3(u_ModelMatrix * a_Position);\n' +
 
  '     v_Normal = normalize(vec3(u_NormalMatrix * a_Normal).xyz);\n' + //this is also used for normal point lighting
//   '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
//   '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
//         // Calculate the color due to diffuse reflection
//   '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
//   '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
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

  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +

  'uniform vec3 u_AmbientLight;\n' +  
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +

  'varying vec4 v_TexColor;\n' +

  'void main() {\n' +
  // Normalize the normal because it is interpolated and not 1.0 in length any more
     '  vec3 normal = normalize(v_Normal);\n' +
  // Calculate the light direction and make its length 1.
'  vec3 lightDirection = normalize(u_LightPosition+u_LightPosition2 - v_Position);\n' +
  // The dot product of the light direction and the orientation of a surface (the normal)
'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
'  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +

// ' if (u_UseTextures){\n' +
//     //'vec4 TexColor = textrure2D(u_Sampler, v_TexCoords);\n'+
//    'vec3 diffuse = u_LightColor *v_Color.rgb * nDotL;\n' +
//   // Calculate the final color from diffuse reflection and ambient reflection
// //'  vec3 diffuse = u_LightColor * TexColor.rgb*v_Color.rgb * nDotL*1.2;\n' +
// '  }else\n' +
// '  {\n' +
// '     vec3 diffuse = u_LightColor *v_Color.rgb * nDotL;\n' +
// '  }\n' + 
'     vec3 diffuse = u_LightColor *v_Color.rgb * nDotL;\n' +
'  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
'  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';

var modelMatrix = new Matrix4(); // The model matrix

var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

var move = 0.8;
var fwdBack = 35;
var leftRight = 0;
var upDown = 0;
var piv = 0;
var lighting = true;
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
  
  gl.uniform1i(u_UseTextures,false);


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
//   var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
var texcoordLocation = gl.getAttribLocation(gl.program, "a_TexCoord");
//  //FOR THE TEXTURES
//  gl.enableVertexAttribArray(texcoordLocation);
//  //  supply texcoords as floats.
//    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

// Set Texcoords.
//setTexcoords(gl);
  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 
  var u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_AmbientLight ||!u_LightPosition  ||
      !u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

//light colour to closely approximate colour of sun
  gl.uniform3f(u_LightColor, 0.976, 0.843, 0.109);
//gl.uniform3f(u_LightColor,1,1,1);
//add a second light source to make it look better
gl.uniform3f(u_LightPosition2,-1,5,6);
gl.uniform3f(u_LightPosition, -2, 5, 6);
gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);
  // Set the light direction (in the world coordinate)
//   var lightDirection = new Vector3([0.5, 3.0, 4.0]);
//   lightDirection.normalize();     // Normalize
//   gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  
  projMatrix.setPerspective(35, canvas.width/canvas.height, 1, 100);
  viewMatrix.setLookAt(leftRight, upDown, fwdBack, 0, piv, -100, 0, 1, 0);
//   currentAngle = animate(currentAngle);  // Update the rotation angle
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    //   // Create a texture.
    //   var texture = gl.createTexture();
    //   gl.bindTexture(gl.TEXTURE_2D, texture);
       
    //   // Fill the texture with a 1x1 blue pixel.
    //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    //                 new Uint8Array([0, 0, 255, 255]));
       
    //   // Asynchronously load an image
    //   var image = new Image();
    //   image.src = "./wall.png";
    //   image.addEventListener('load', function() {
    //     // Now that the image has loaded make copy it to the texture.
    //     gl.bindTexture(gl.TEXTURE_2D, texture);
    //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    //     gl.generateMipmap(gl.TEXTURE_2D);
    //   });
  document.onkeydown = function(ev){
    keydown(ev);
  };
  var funDraw = function(){
      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting,u_UseTextures,u_ViewMatrix);
      requestAnimationFrame(funDraw);
  }
  funDraw();
  //draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}




//draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);



function keydown(ev) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
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
    upDown = (upDown + 0.2*move) ;
      break;
    case 74: // j for down
    upDown = (upDown - 0.2*move) ;
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
    1.0, 2.5, 1.0,  -1.0, 2.5, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 2.5, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 2.5,-1.0,    // v0-v3-v4-v5 right
    1.0, 2.5, 1.0,   1.0, 2.5,-1.0,  -1.0, 2.5,-1.0,  -1.0, 2.5, 1.0,    // v0-v5-v6-v1 up
   -1.0, 2.5, 1.0,  -1.0, 2.5,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 2.5,-1.0,   1.0, 2.5,-1.0,    // v4-v7-v6-v5 back
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


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  //if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 3, gl.FLOAT)) return -1;
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
 

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);



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
      
//   function loadTexture(gl, n, texture, u_Sampler, image) {
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
//     // Enable texture unit0
//     gl.activeTexture(gl.TEXTURE0);
//     // Bind the texture object to the target
//     gl.bindTexture(gl.TEXTURE_2D, texture);
  
//     // Set the texture parameters
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.REPEAT);
//     // Set the texture image
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
//     // Set the texture unit 0 to the sampler
//     gl.uniform1i(u_Sampler, 0);

//     gl.uniform1i(u_UseTextures,false);
    
//     gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
//     gl.draw();
//   }
  
function initArrayBuffer (gl, attribute, data, num, type) {
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
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
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
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting,u_UseTextures, u_ViewMatrix) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting
  gl.uniform1i(u_UseTextures, false); // Will not apply lighting


 
    viewMatrix.setLookAt(leftRight, upDown, fwdBack, piv, 0, -100, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    viewMatrix.rotate(g_yAngle,0,1,0);
    viewMatrix.rotate(g_xAngle,1,0,0);
    viewMatrix.setTranslate(0,0,0);


  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.uniform1i(u_isLighting, lighting); // Will apply lighting

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

//   // Set texture
//   if (!initTextures(gl, n)) {
//     console.log('Failed to intialize the texture.');
//     return;
//   }

  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  // model for the right side of the building
  changeColour(gl,0.86,0.86,0.76);
  pushMatrix(modelMatrix);
  
    modelMatrix.translate(5,-1.0,0)
    modelMatrix.scale(3.0, 1.1, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //model for the left side of the building
  pushMatrix(modelMatrix);
    modelMatrix.translate(-5,-1.0,0)
    modelMatrix.scale(3.0, 1.1, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

//model for the main part of the building
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0.25);  // Translation
    modelMatrix.scale(2.0, 2.0, 2.25); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //windows are inside anothe texture so one window will be seen from front and back
// windows 
changeColour(gl,1,1,1);
pushMatrix(modelMatrix);
modelMatrix.translate(3, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(5, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(7, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-3, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-5, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-7, 0.25, 0);  // Translation
modelMatrix.scale(0.4, 0.4, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

// windows bottom row
pushMatrix(modelMatrix);
modelMatrix.translate(3, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(5, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(7, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-3, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-5, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows
pushMatrix(modelMatrix);
modelMatrix.translate(-7, -1.25, 0);  // Translation
modelMatrix.scale(0.4, 0.3, 2.1); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


//windows top (mid)
pushMatrix(modelMatrix);
modelMatrix.translate(0.75, 3, 0.25);  // Translation
modelMatrix.scale(0.4, 0.4, 2.35); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//windows top (mid)
pushMatrix(modelMatrix);
modelMatrix.translate(-0.75, 3, 0.25);  // Translation
modelMatrix.scale(0.4, 0.4, 2.35); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//door
pushMatrix(modelMatrix);
modelMatrix.translate(0, -0.5, 2.5);  // Translation
modelMatrix.scale(0.9, 0.75, 0.25); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();


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



//roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,2.2,1.4);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(8,0.78,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//back roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,2.2,-1.4);
modelMatrix.rotate(45,1,0,0);
modelMatrix.scale(8,0.78,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//top front roof of building
pushMatrix(modelMatrix);
modelMatrix.translate(0,5.7,1.7);
modelMatrix.rotate(-45,1,0,0);
modelMatrix.scale(2,1,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//top back roof of buidling
pushMatrix(modelMatrix);
modelMatrix.translate(0,5.7,-1.35);
modelMatrix.rotate(40,1,0,0);
modelMatrix.scale(2,0.9,0.1);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//trees outside

for (var i=-10; i<=10; i+=4){
    changeColour(gl,0.435, 0.274, 0.105);
    pushMatrix(modelMatrix);
        modelMatrix.translate(i, -1.55, 10);  // Translation
        modelMatrix.scale(0.25, 0.4, 0.25); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();
}
    // for (var z=i; z<=10; i++){
    //     changeColour(gl,0.435, 0.274, 0.105);
    // pushMatrix(modelMatrix);
    //     modelMatrix.translate(i, -1.55, i+10);  // Translation
    //     modelMatrix.scale(0.25, 0.4, 0.25); // Scale
    //     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    //   modelMatrix = popMatrix();
    // }

//stair 2 (lower)
pushMatrix(modelMatrix);
changeColour(gl, 0.2,0.2,0.2);
modelMatrix.translate(0, -2, 5.5);  // Translation
modelMatrix.scale(1, 0.1, 0.5); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
//floor/grass
pushMatrix(modelMatrix);
changeColour(gl, 0.529,0.921,0.580);
modelMatrix.translate(-5,-14.45,-5);
modelMatrix.scale(50,5,50);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

var n = initVertexBuffersCone(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //cover of side roof right
  pushMatrix(modelMatrix);
changeColour(gl, 0.529,0.921,0.580);
modelMatrix.translate(7.8,2.5,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4,1.7,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//cover of side roof left
pushMatrix(modelMatrix);
changeColour(gl, 0.529,0.921,0.580);
modelMatrix.translate(-7.8,2.5,0);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4,1.7,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//cover of top roof right
pushMatrix(modelMatrix);
changeColour(gl, 0.529,0.921,0.580);
modelMatrix.translate(1.9,6.1,0.2);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4.5,2.3,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//cover of top roof left
pushMatrix(modelMatrix);
changeColour(gl, 1,1,1);
modelMatrix.translate(-1.9,6.1,0.2);
modelMatrix.rotate(90,0,1,0);
modelMatrix.scale(4.5,2.3,4);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();
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

     if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;

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
