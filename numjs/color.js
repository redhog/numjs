define([
  "numjs/webgl"
], function (
  webgl
) {
  var color = {
    float2color: function() {
      var handleLittleEndian = '';
      if (webgl.isLittleEndian()) {
        handleLittleEndian = `
          res = vec4(res[3], res[2], res[1], res[0]);
        `;
      }

      return `
        bool isnan(float val) {
          return (val < 0.0 || 0.0 < val || val == 0.0) ? false : true;
        }

        bool isinf(float val) {
          return (val != 0.0 && val * 2.0 == val) ? true : false;
        }

        vec4 float2color(float value) {
          float sign = 0.0;
          float exp = 0.0;
          vec3 frac = vec3(0.0, 0.0, 0.0);

          if (value < 0.0) {
            sign = 1.0;
            value = -value;
          }

          if (isnan(value)) {
            exp = 255.0;
            frac = vec3(64.0, 0.0, 0.0);
          } else if (isinf(value)) {
            exp = 255.0;
            frac = vec3(0.0, 0.0, 0.0);
          } else if (value == 0.0) {
            exp = 0.0;
            frac = vec3(0.0, 0.0, 0.0);
          } else {
            exp = floor(log2(value)) + 127.0;

            // while (value < exp2(23.0)) {
            for (int i = 0; i < 24; i++) {
              if (value >= exp2(23.0)) break;
              value = value * 2.0;
            }
            value = value - exp2(23.0);

            frac[0] = floor(value / exp2(16.0));
            value = value - frac[0] * exp2(16.0);
            frac[1] = floor(value / exp2(8.0));
            value = value - frac[1] * exp2(8.0);
            frac[2] = value;
          }

          vec4 res = vec4(
            sign * 128.0 + floor(exp / 2.0),
            mod(exp, 2.0) * 128.0 + frac[0],
            frac[1],
            frac[2]
          ) / 255.;

          ${handleLittleEndian}

          return res;
        }
      `;
    },

    color2float: function() {
      var handleLittleEndian = '';
      if (webgl.isLittleEndian()) {
        handleLittleEndian = `
          value = vec4(value[3], value[2], value[1], value[0]);
        `;
      }

      return `
        float color2float(vec4 value) {
          ${handleLittleEndian}

          value = floor(value * 256.); // Hack needed to handle precision errors, and round(value*255) not being available in GLSL ES

          float sign = floor(value[0] / 128.0) == 1. ? -1. : 1.;
          float exp = mod(value[0], 128.0) * 2.0 + floor(value[1] / 128.0);
          float frac = mod(value[1], 128.0) * exp2(16.) + value[2] * exp2(8.) + value[3];

          if (exp == 255.0 && frac > 0.0) {
            return 0. / 0.; // Might not work due to an optimizing compiler, check
          } else if (exp == 255.0 && frac == 0.0) {
            return sign * (1. / 0.);
          } else if (exp == 0.0 && frac == 0.0) {
            return 0.0;
          } else {
            exp = exp - 127.0 - 23.0;
            frac = frac + exp2(23.);
            return frac * exp2(exp);
          }
        }
      `;
    }
  };

  return color;
});

