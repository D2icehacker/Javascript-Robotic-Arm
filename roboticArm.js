/* eslint-disable require-jsdoc */
'use strict';

let canvas; let gl; let program;
let modelViewMatrix; let modelViewMatrixLoc; let projectionMatrix;

let NumVertices = 36; // (6 faces)(2 triangles/face)(3 vertices/triangle)

let points = [];
let normals = [];

let angle = 0;
let angleSine = 0;
let rotateOn = true;

// Parameters controlling the size of the Robot's arm
const BASE_HEIGHT = 2.0;
const BASE_WIDTH = 5.0;
const LOWER_ARM_HEIGHT = 5.0;
const LOWER_ARM_WIDTH = 0.5;
const UPPER_ARM_HEIGHT = 5.0;
const UPPER_ARM_WIDTH = 0.5;

// Array of rotation angles (in degrees) for each rotation axis
const Base = 0;
const LowerArm = 1;
const UpperArm = 2;

const theta = [0, 0, 0];

window.onload = function init() {
  canvas = document.getElementById('gl-canvas');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    window.alert('WebGL 2.0 is not available');
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // from 8E09/geometry.js
  const myCube = cylinder();
  NumVertices = myCube.TriangleVertices.length;
  const myMaterial = goldMaterial();
  const myLight = light0();

  // Load shaders and use the resulting shader program
  program = initShaders(gl, 'vertex-shader-1', 'fragment-shader-1');
  gl.useProgram(program);

  // Create and initialize buffer objects
  points = myCube.TriangleVertices;
  normals = myCube.TriangleNormals;

  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, 'aPosition');
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  const nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
  const normalLoc = gl.getAttribLocation(program, 'aNormal');
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  // products of material and light properties
  const ambientProduct = mult(myLight.lightAmbient,
      myMaterial.materialAmbient);
  const diffuseProduct = mult(myLight.lightDiffuse,
      myMaterial.materialDiffuse);
  const specularProduct = mult(myLight.lightSpecular,
      myMaterial.materialSpecular);

  document.getElementById('toggle').onclick = function(event) {
    rotateOn = !rotateOn;
  };
  document.getElementById('slider1').onchange = function(event) {
    theta[Base] = event.target.value;
  };
  document.getElementById('slider2').onchange = function(event) {
    theta[1] = event.target.value;
  };
  document.getElementById('slider3').onchange = function(event) {
    theta[2] = event.target.value;
  };

  modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
  projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
  gl.uniformMatrix4fv(
      gl.getUniformLocation(program, 'projectionMatrix'),
      false, flatten(projectionMatrix));
  gl.uniform4fv(gl.getUniformLocation(program, 'ambientProduct'),
      flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, 'diffuseProduct'),
      flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, 'specularProduct'),
      flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, 'lightPosition'),
      flatten(myLight.lightPosition));
  gl.uniform1f(gl.getUniformLocation(program,
      'shininess'), myMaterial.materialShininess);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'),
      false, flatten(projectionMatrix));
  render();
};

function base() {
  const s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
  const instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
  const t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function upperArm() {
  const s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
  const instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
  const t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function lowerArm() {
  const s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
  const instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
  const t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (rotateOn) {
    angle = ((angle + 1.0) % 360);
    angleSine = Math.sin(angle * Math.PI / 180);
    theta[Base] = angleSine * 180;
    theta[LowerArm] = angleSine * 60;
    theta[UpperArm] = angleSine * 30;
  }
  // render the base
  document.getElementById('slider1').value = theta[Base];
  modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0));
  base();
  // render the lowerArm
  document.getElementById('slider2').value = theta[LowerArm];
  modelViewMatrix = mult(modelViewMatrix,
      translate(0.0, BASE_HEIGHT, 0.0));
  modelViewMatrix = mult(modelViewMatrix,
      rotate(theta[LowerArm], vec3(0, 0, 1)));
  lowerArm();
  // render the UpperArm
  document.getElementById('slider3').value = theta[UpperArm];
  modelViewMatrix = mult(modelViewMatrix,
      translate(0.0, LOWER_ARM_HEIGHT, 0.0));
  modelViewMatrix = mult(modelViewMatrix,
      rotate(theta[UpperArm], vec3(0, 0, 1)));
  upperArm();

  window.requestAnimationFrame(render);
}
