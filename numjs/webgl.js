define([
  "bower_components/cpp.js/cpp.js"
], function (
  __
) {
  var webgl = {
    formatError: function(log, src) {
      var match = log.match(/ERROR: [0-9]*:([0-9]*): (.*)/);
      var line = parseInt(match[1]);
      var msg = match[2];

      var lines = src.split('\n');
      return [].concat(
        lines.slice(0, line),
        ['/********************************',
         ' * ',
         ' * ' + msg,
         ' * ',
         ' ********************************/',
         ''],
        lines.slice(line)
      ).join('\n');
    },

    cpp_js_glsl: cpp_js({}),

    createShaderProgramFromSource: function(gl, vertexSrc, fragmentSrc, attr0, header) {
      if (header) webgl.cpp_js_glsl.run(header);
      vertexSrc = webgl.cpp_js_glsl.run(vertexSrc);
      fragmentSrc = webgl.cpp_js_glsl.run(fragmentSrc);
      webgl.cpp_js_glsl.clear();

      // create vertex shader
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexSrc);
      gl.compileShader(vertexShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        var err = webgl.formatError(gl.getShaderInfoLog(vertexShader), vertexSrc);
        console.error(err);
        throw err;
      }

      // create fragment shader
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentSrc);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        var err = webgl.formatError(gl.getShaderInfoLog(fragmentShader), fragmentSrc);
        console.error(err);
        throw err;
      }

      // link shaders to create our program
      var program = gl.createProgram();
      program.gl = gl;
      program.vertexSrc = vertexSrc;
      program.fragmentSrc = fragmentSrc;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      if (attr0 != undefined) {
        gl.bindAttribLocation(program, 0, attr0);
      }

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var err = gl.getProgramInfoLog(program);
        console.error(err);
        throw err;
      }

      gl.useProgram(program);

      // Collect attribute locations to make binding easier in the code using this program
      program.attributes = {};
      program.buffers = {};
      for (var i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i++) {
        var name = gl.getActiveAttrib(program, i).name;
        program.attributes[name] = gl.getAttribLocation(program, name);
        program.buffers[name] = gl.createBuffer();
      }

      program.uniforms = {};
      for (var i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
        var name = gl.getActiveUniform(program, i).name;
        program.uniforms[name] = gl.getUniformLocation(program, name);
      }

      program.boundAttributes = [];

      program.loadArray = function(name, arraydata, size, type, stride, offset) {
        var gl = program.gl;
        if (program.attributes[name] == undefined) {
          console.warn(["Attempted to set an non-existent attribute " + name + ".", program]);
        } else if (arraydata == null) {
          gl.disableVertexAttribArray(program.attributes[name]);
        } else {
          program.boundAttributes.push(program.attributes[name]);

          gl.bindBuffer(gl.ARRAY_BUFFER, program.buffers[name]);
          gl.bufferData(gl.ARRAY_BUFFER, arraydata, gl.STATIC_DRAW);

          gl.enableVertexAttribArray(program.attributes[name]);
          gl.vertexAttribPointer(program.attributes[name], size, type, false, stride || 0, offset || 0);
        }
      };

      program.disableArrays = function() {
        program.boundAttributes.map(function (idx) {
          program.gl.disableVertexAttribArray(idx);
        });
        program.boundAttributes = [];
      };

      program.bindUniform = function (name, value) {
        // FIXME: Use type and size of uniform instead...
        if (typeof(value) == "number") {
          program.gl.uniform1f(program.uniforms[name], value);
        } else if (typeof(value) == "object") {
          if (value.constructor == Float32Array) {
            program.gl["uniform" + value.length + "fv"]( program.uniforms[name], value);
          } else if (value.constructor == Int32Array) {
            program.gl["uniform" + value.length + "iv"]( program.uniforms[name], value);
          }
        }
      };

      program.textureCounter = 0;
      program.bindTexture = function (name, texture) {
        var id = program.textureCounter++;
        program.gl.activeTexture(program.gl["TEXTURE" + id]);
        program.gl.bindTexture(program.gl.TEXTURE_2D, texture);
        program.gl.uniform1i(program.uniforms[name], id);
      }
      program.resetTextures = function () {
        program.textureCounter = 0;
      }

      return program;
    },

    isLittleEndian: function() {
      var arrayBuffer = new ArrayBuffer(2);
      var uint8Array = new Uint8Array(arrayBuffer);
      var uint16array = new Uint16Array(arrayBuffer);
      uint8Array[0] = 0xAA;
      uint8Array[1] = 0xBB;
      if (uint16array[0] === 0xBBAA) {
        return true;
      } else if (uint16array[0] === 0xAABB) {
        return false;
      } else {
        throw new Error("Broken typed array implementation detected");
      }
    }
  };

  return webgl;
});
