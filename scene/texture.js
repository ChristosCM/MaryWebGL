var cubeRotation = 0.0;
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

main();

//
// Start here
//
function main() {
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.529, 0.807, 0.921, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // If we don't have a GL context, give up now

  //DONE

  // Vertex shader program

  const vsSource = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ProjMatrix;
    uniform mat4 u_ViewMatrix;
    varying highp vec2 v_TexCoord;
    void main(void) {
      gl_Position = u_ProjMatrix  *u_ModelMatrix * a_Position;
      v_TexCoord = a_TexCoord;}`;
//        v_Position = vec3(u_ModelMatrix * a_Position);
//        v_Position2 = vec3(u_ModelMatrix * a_Position);

//     }
//   `;


  // Fragment shader program

  const fsSource = `
  #ifdef GL_ES\n
  precision mediump float;\n
  #endif\n
  uniform vec3 u_LightColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightPosition2;
  uniform vec3 u_AmbientLight;
  varying vec3 v_Position;
    varying highp vec2 v_TexCoord;
    uniform sampler2D u_Sampler;
    void main(void) {
      gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }
  `;
//         vec3 lightDirection = normalize(u_LightPosition+u_LightPosition2 - v_Position);

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aTextureCoord and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'a_Position'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'a_TexCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_ProjMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_ModelMatrix'),
      //viewMatrix: gl.getUniformLocation(shaderProgram, 'u_ViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'u_Sampler'),
    },
  };

  projMatrix.setPerspective(35, canvas.width/canvas.height, 1, 100);
  viewMatrix.setLookAt(leftRight, upDown, fwdBack, 0, piv, -100, 0, 1, 0);

  //gl.uniformMatrix4fv(viewMatrix, false, viewMatrix.elements);
  //gl.uniformMatrix4fv(projMatrix, false, projMatrix.elements);

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  const texture = loadTexture(gl, 'wall.jpg');

  var then = 0;

  // Draw the scene repeatedly
  function funDraw(now) {
    now *= 0.000;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, texture, deltaTime);

    requestAnimationFrame(funDraw);
  }
  requestAnimationFrame(funDraw);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  var positions = new Float32Array([   // Coordinates
    1.0, 2.5, 1.0,  -1.0, 2.5, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 2.5, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 2.5,-1.0,    // v0-v3-v4-v5 right
    1.0, 2.5, 1.0,   1.0, 2.5,-1.0,  -1.0, 2.5,-1.0,  -1.0, 2.5, 1.0,    // v0-v5-v6-v1 up
   -1.0, 2.5, 1.0,  -1.0, 2.5,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 2.5,-1.0,   1.0, 2.5,-1.0,    // v4-v7-v6-v5 back
  ]);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Now set up the texture coordinates for the faces.

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    var texCoords = new Float32Array([
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0
      ]);
    

  gl.bufferData(gl.ARRAY_BUFFER, texCoords,gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = new Uint16Array([
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ]);

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices, gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
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
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, texture, deltaTime) {
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
modelMatrix = modelViewMatrix
  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotation,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotation * .7,// amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around (X)

// pushMatrix(modelMatrix);
//     mat4.translate(modelMatrix,modelMatrix,[5,-1.0,0])
//     mat4.scale(modelMatrix,modelMatrix,[3,1.1,2])
//     drawbox(gl, modelViewMatrix,buffers.indices.length );
//   modelMatrix = popMatrix();

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
//DONE
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function drawbox(gl, u_ModelMatrix, n) {
    pushMatrix(modelMatrix);
  
      // Pass the model matrix to the uniform variable
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
      // Calculate the normal transformation matrix and pass it to u_NormalMatrix
      g_normalMatrix.setInverseOf(modelMatrix);
      g_normalMatrix.transpose();
      //gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  
      // Draw the cube
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  
    modelMatrix = popMatrix();
  }
  
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
