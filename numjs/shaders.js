define([
  "numjs/webgl",
  "numjs/color"
], function (
  webgl,
  color
) {
  var shaders = {
    range_vertex: function(expr) {
      return `
        attribute float x;
        attribute float y;
        uniform float width;
        uniform float height;

        void main () {
          gl_Position = vec4(
            2. * (x + .5) / width - 1.,
            2. * (y + .5) / height - 1.,
            -1, 1.);
          gl_PointSize=1.0;
        }
      `;
    },

    range_fragment: function() {
      var float2color = color.float2color();

      return `
        precision mediump float;

        ${float2color}

        void main() {
          gl_FragColor = float2color(gl_FragCoord.x - .5);
        }
      `;
    },

    texture_expr_fragment: function(expr, header) {
      var float2color = color.float2color();
      var color2float = color.color2float();

      return `
#define _decl(name) uniform sampler2D name; uniform vec2 name##_size
#define _(name, coord) _param(name, name##_size, coord)

        precision highp float;

        ${float2color}
        ${color2float}
        ${header}

        uniform float width;
        uniform float height;

        float _param(sampler2D samp, vec2 size, vec2 coord) {
          return color2float(texture2D(samp, (coord + .5) / size, 0.));
        }

        void main() {
          vec2 coord = vec2(gl_FragCoord.x, gl_FragCoord.y) - .5;
          gl_FragColor = float2color(${expr});
        }
      `;
    }
  };

  return shaders;
});
