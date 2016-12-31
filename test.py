import bitstring, random, numpy

def float2bits(x):
    F = numpy.float32
    x = F(x)
    sign = F(0.0)
    exp = F(0.0)
    frac = [F(0.0), F(0.0), F(0.0)]

    if x < F(0.0):
        sign = F(1.0)
        x = -x

    if numpy.isnan(x):
        exp = F(255.0)
        frac = [F(64.0), F(0.0), F(0.0)]
    elif numpy.isinf(x):
        exp = F(255.0)
        frac = [F(0.0), F(0.0), F(0.0)]
    elif x == F(0.0):
        exp = F(0.0)
        frac = [F(0.0), F(0.0), F(0.0)]
    else:
        exp = numpy.floor(numpy.log2(x)) + 127
        
        while x < F(2**23):
            x = x * F(2)
        x = x - F(2**23)

        # print "NNNNN1", bitstring.pack("uint:23", x).bin
        frac[0] = numpy.floor(x / F(2**16))
        x = x - frac[0] * F(2**16)
        frac[1] = numpy.floor(x / F(2**8))
        x = x - frac[1] * F(2**8)
        frac[2] = x

    return [sign * 128.0 + numpy.floor(exp / 2.0),
            (exp % 2.0) * 128.0 + frac[0],
            frac[1],
            frac[2]
            ]

def bits2float(bits):
    F = numpy.float32

    sign = numpy.floor(bits[0] / 128.0)
    if sign == 1.0:
        sign = -1.0
    else:
        sign = 1.0
    exp = (bits[0] % 128.0) * 2.0 + numpy.floor(bits[1] / 128.0)
    frac = (bits[1] % 128.0) * F(2**16) + bits[2] * F(2**8) + bits[3]

    if exp == 255.0 and frac > 0.0:
        return numpy.NaN
    elif exp == 255.0 and frac == 0.0:
        return sign * numpy.Inf
    elif exp == 0.0 and  frac == 0.0:
        return 0.0
    else:
        exp = exp - 127.0 - 23.0
        frac = frac + F(2**23)
        return frac * 2**exp

def float2bitstring(x):
    return bitstring.pack("uint:8,uint:8,uint:8,uint:8", *float2bits(x))

def disp(x):
    x = x.bin
    return "%s, %s, %s" % (x[0:1], x[1:9], x[9:])

#unpack("uint:1, uint:8, uint:23")

def printdiff(x):
    print "%s: %s != %s" % (x, disp(bitstring.pack("float:32", x)), disp(float2bitstring(x)))
    print "    %s != %s" % (bitstring.pack("float:32", x).unpack("float:32"), float2bitstring(x).unpack("float:32"))

if __name__ == "__main__":
    if False:
        x = 1.64740653118
        printdiff(x)
    elif False:
        for a in xrange(0, 100):
            x = random.random() * 2**(23*random.random())
            x = bitstring.pack("float:32", x).unpack("float:32")[0] # Cast to float32
            if bitstring.pack("float:32", x) != float2bitstring(x):
                printdiff(x)
        for x in ['NaN', "Inf", "-Inf"]:
            x = float(x)
            if bitstring.pack("float:32", x) != float2bitstring(x):
                printdiff(x)
    else:
        for a in xrange(0, 100):
            x = random.random() * 2**(23*random.random())
            x = bitstring.pack("float:32", x).unpack("float:32")[0] # Cast to float32
            res = bits2float(float2bits(x))
            if res != x:
                print "%s != %s" % (res, x)

        for x in ['NaN', "Inf", "-Inf"]:
            x = float(x)
            res = bits2float(float2bits(x))
            if res != x and not (numpy.isnan(x) and numpy.isnan(res)):
                print "%s != %s" % (res, x)
        
