define([
  "numjs/webgl"
], function (
  webgl
) {
  var Value = function (ctx, value, args) {
    var self = this;
    var gl = ctx.gl;
    self.ctx = ctx;
    self.usage = 1;
    self.args = args || {};

    if (value && value.constructor == Float32Array) {
      value = value.buffer;
    }
    if (value && value.constructor == WebGLTexture) {
      self.value = value;
    } else {
      self.value = gl.createTexture();
      if (value == undefined) {
        // Intentionally left blank
      } else if (value.constructor = ArrayBuffer) {
        var length = value.byteLength / 4;
        self.buffer = value;
        if (!self.args.size) { 
          self.args.size = Float32Array.from([length, 1]);
        }
        value = new Uint8Array(value);
      } else {
        throw "Value must be texture, Float32Array, ArrayBuffer or undefined";
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, self.value);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, self.args.size[0], self.args.size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, value);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
    return self;
  };
  Value.prototype.bind = function(program, name) {
    var self = this;
    program.bindTexture(name, self.value);
    for (var attr in self.args) {
      program.bindUniform(name + "_" + attr, self.args[attr]);
    }
  };
  Value.prototype.bindFramebuffer = function() {
    var self = this;
    var ctx = self.ctx;
    var gl = ctx.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.getTextureFramebuffer());

    gl.bindRenderbuffer(gl.RENDERBUFFER, ctx.getRenderbuffer());
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, self.args.size[0], self.args.size[1]);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.value, 0);
    var status = webgl.framebufferStatus2Name(gl, gl.checkFramebufferStatus(gl.FRAMEBUFFER));
    if (status.name != 'FRAMEBUFFER_COMPLETE') {
      throw status;
    }
  };
  Value.prototype.toArrayBuffer = function (dereference) {
    var self = this;
    var ctx = self.ctx;
    var gl = ctx.gl;
    if (true || !self.buffer) {
      self.bindFramebuffer();
      var pixels = new Uint8Array(4 * self.args.size[0] * self.args.size[1]);
      gl.readPixels(0, 0, self.args.size[0], self.args.size[1], gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      self.buffer = pixels.buffer;
    }
    var buffer = self.buffer;
    if (dereference) {
      self.dereference();
    }
    return buffer;
  };
  Value.prototype.toFloat32Array = function () {
    var self = this;
    return new Float32Array(self.toArrayBuffer());
  }

  return Value;
});
