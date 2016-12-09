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

def float2bitstring(x):
    return bitstring.pack("uint:8,uint:8,uint:8,uint:8", *float2bits(x))

def disp(x):
    x = x.bin
    return "%s, %s, %s" % (x[0:1], x[1:9], x[9:])

#unpack("uint:1, uint:8, uint:23")

def printdiff(x):
    print "%s: %s != %s" % (x, disp(bitstring.pack("float:32", x)), disp(float2bitstring(x)))
    print "    %s != %s" % (bitstring.pack("float:32", x).unpack("float:32"), float2bitstring(x).unpack("float:32"))

if False:
    x = 1.64740653118
    printdiff(x)
else:
    for a in xrange(0, 100):
        x = random.random() * 2**(23*random.random())
        x = bitstring.pack("float:32", x).unpack("float:32")[0] # Cast to float32
        if bitstring.pack("float:32", x) != float2bitstring(x):
            printdiff(x)
    for x in ['NaN', "Inf", "-Inf"]:
        x = float(x)
        if bitstring.pack("float:32", x) != float2bitstring(x):
            printdiff(x)
