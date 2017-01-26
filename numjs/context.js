define([
  "numjs/webgl",
  "numjs/shaders",
  "numjs/value"
], function (
  webgl,
  shaders,
  Value
) {
  var Context = function () {
    var self = this;

    self.canvas = document.createElement('canvas');
    self.gl = self.canvas.getContext('experimental-webgl', {preserveDrawingBuffer: true, antialias: false});
    self.gl.clearColor(.5, .5, .5, 1.0);
    self.programs = {};
    self.programs.range = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.range_fragment(), "x");

    self.programs.texture_identity = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.texture_expr_fragment("_(a, coord)", "_decl(a);"), "x");
    self.programs.add = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.texture_expr_fragment("_(a, coord) + _(b, coord)", "_decl(a); _decl(b);"), "x");
    self.programs.sub = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.texture_expr_fragment("_(a, coord) - _(b, coord)", "_decl(a); _decl(b);"), "x");
    self.programs.mult = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.texture_expr_fragment("_(a, coord) * _(b, coord)", "_decl(a); _decl(b);"), "x");
    self.programs.div = webgl.createShaderProgramFromSource(self.gl, shaders.range_vertex(), shaders.texture_expr_fragment("_(a, coord) / _(b, coord)", "_decl(a); _decl(b);"), "x");
  };

  Context.prototype.createValue = function (value, args) {
    return new Value(this, value, args);
  };


  Context.prototype.texture_identity = function (value) {
    var self = this;

    return self.render("texture_identity", function (program) {
      value.bind(program, "a");

      var x = new Float32Array(2);
      var y = new Float32Array(2);

      x[0] = 0;
      y[0] = 0;
      x[1] = value.args.size[0];
      y[1] = 0;

      program.loadArray("x", x, 1,  self.gl.FLOAT);
      program.loadArray("y", y, 1,  self.gl.FLOAT);

      self.gl.drawArrays(self.gl.LINES, 0, 2);
    }, value.args.size[0], 1);
  };

  Context.prototype.render = function (name, drawFn, width, height) {
    var self = this;
    var program = self.programs[name];
    self.canvas.width = width;
    self.canvas.height = height;
    self.gl.useProgram(program);
    self.gl.viewport(0, 0, self.canvas.width, self.canvas.height);
    program.gl.uniform1f(program.uniforms.width, self.canvas.width);
    program.gl.uniform1f(program.uniforms.height, self.canvas.height);
    self.gl.clear(self.gl.COLOR_BUFFER_BIT);

    var outputValue = self.createValue(null, {size: [width, height]});
    outputValue.withFramebuffer(function (framebuffer) {
      drawFn(program);
    });

    program.disableArrays();
    program.resetTextures();

    return outputValue;
  };

  Context.prototype.range = function (length) {
    var self = this;

    return self.render(
      "range",
      function (program) { 
        var x = new Float32Array(2);
        var y = new Float32Array(2);

        x[0] = 0;
        y[0] = 0;
        x[1] = length;
        y[1] = 0;

        program.loadArray("x", x, 1,  self.gl.FLOAT);
        program.loadArray("y", y, 1,  self.gl.FLOAT);

        self.gl.drawArrays(self.gl.LINES, 0, 2);
      }, length, 1);
  };

  Context.prototype.itemwizeOp = function (name) {
    return function(args) {
      var self = this;
      args = Array.prototype.slice.call(arguments);
      var argnames = ["a", "b", "c", "d", "e"];

      return self.render(name, function (program) {
        for (var i = 0; i < args.length; i++) {
          args[i].bind(program, argnames[i]);
        }

        var x = new Float32Array(2);
        var y = new Float32Array(2);

        x[0] = 0;
        y[0] = 0;
        x[1] = args[0].args.size[0];
        y[1] = 0;

        program.loadArray("x", x, 1,  self.gl.FLOAT);
        program.loadArray("y", y, 1,  self.gl.FLOAT);

        self.gl.drawArrays(self.gl.LINES, 0, 2);
      }, args[0].args.size[0], 1);
    }
  }
  Context.prototype.identity = Context.prototype.itemwizeOp('identity');
  Context.prototype.add = Context.prototype.itemwizeOp('add');
  Context.prototype.sub = Context.prototype.itemwizeOp('sub');
  Context.prototype.mult = Context.prototype.itemwizeOp('mult');
  Context.prototype.div = Context.prototype.itemwizeOp('div');

  Context.prototype.sum = function(a) {
    var self = this;
    var length;
    while (a.length > 1000) {
      length = a.length;

      if (length % 4 != 0) {
        var diff = length % 4;

        if (first) a = Float32Array(a);
        a1 = new Float32Array(a.buffer, 0, length - diff);

        for (var i = a1.length; i < a.length; i++) {
          a1[a1.length - 1] += a[i];
        }
        a = a1;

        length = length - diff;
      }

      var length = length / 4;

      var x = self.range(length);
      var y = new Float32Array(length); // 0:oes

      var program = self.setOutput('sum', length, 1);

      program.loadArray("x", x, 1,  self.gl.FLOAT);
      program.loadArray("y", y, 1,  self.gl.FLOAT);

      program.loadArray('a', a, 4,  self.gl.FLOAT);

      self.gl.drawArrays(self.gl.POINTS, 0, length);

      program.disableArrays();

      a = self.getOutput();
      first = false;
    }

    return a.reduce(function (a, b) { return a + b; });
  }
  return Context;
});
