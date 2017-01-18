define([
], function (
) {
  var Value = function (ctx, value, args) {
    var self = this;
    var gl = ctx.gl;
    self.ctx = ctx;
    self.usage = 1;
    self.args = args || {};

    if (value.constructor == Float32Array) {
      value = value.buffer;
    }
    if (value.constructor == WebGLTexture) {
      self.value = value;
    } else if (value.constructor = ArrayBuffer) {
      var length = value.byteLength / 4;
      self.buffer = value;
      self.value = gl.createTexture();
      if (!self.args.size) { 
        self.args.size = Float32Array.from([length, 1]);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, self.value);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(value));

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
      throw "Value must be texture, Float32Array or ArrayBuffer";
    }
  };
  Value.prototype.dereference = function() {
    var self = this;
    self.usage--;
    if (self.usage <= 0) {
      self.ctx.gl.deleteTexture(self.value);
    }
  };
  Value.prototype.reference = function() {
    var self = this;
    self.usage++;
  };
  Value.prototype.bind = function(program, name) {
    var self = this;
    program.bindTexture(name, self.value);
    for (var attr in self.args) {
      program.bindUniform(name + "_" + attr, self.args[attr]);
    }
  };
  return Value;
});
