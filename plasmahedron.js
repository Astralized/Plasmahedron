var canvas    = document.getElementById('canvas'),
    c_x       = canvas.width,
    c_y       = canvas.height,
    ctx       = canvas.getContext('2d'),
    imageData = ctx.getImageData(0, 0, c_x, c_y),
    data      = imageData.data,
    mouse     = {
        button:0,
            ox:0,
            oy:0,
             x:0,
             y:0
              };


buf       = new ArrayBuffer(imageData.data.length);
buf8      = new Uint8ClampedArray(buf);
data32    = new Uint32Array(buf);
data32[1] = 0x0a0b0c0d;
    
isLittleEndian = true;
if (buf[4] === 0x0a && buf[5] === 0x0b && buf[6] === 0x0c &&
    buf[7] === 0x0d) {
    isLittleEndian = false;
}

//tetrahedron
vert  = [[0,0,0],
        [1,0,0],
        [0,1,0],
        [0,0,1]];

faces = [[0,2,1],[0,3,2],[0,1,3],[1,2,3]];


var xrspeed,
    yrspeed, 
    zrspeed = 0.01,
    fov     = 350,
    size    = 150;

function cube3d() {
    for(i = 0; i < vert.length; i++) {
        p     = vert[i];
        x     = p[0];
        y     = p[1];
        z     = p[2];

        xcosa = Math.cos(xrspeed);
        xsina = Math.sin(xrspeed);
        ycosa = Math.cos(yrspeed);
        ysina = Math.sin(yrspeed);
        zcosa = Math.cos(zrspeed);
        zsina = Math.sin(zrspeed);

        xy    = xcosa * y - xsina * z;
        xz    = xsina * y + xcosa * z;

        yz    = ycosa * xz - ysina * x; 
        yx    = ysina * xz + ycosa * x;

        zx    = zcosa * yx - zsina * xy; 
        zy    = zsina * yx + zcosa * xy;

        p[0]  = zx;
        p[1]  = zy;
        p[2]  = yz;
    
    }
    plasma();
}


var r, g, b, time = 0;

function num(px1, py1, px2, py2, px3, py3) {
    return (px1 - px3) * (py2 - py3) - (px2 - px3) * (py1 - py3);
}

function checkpoint(x, y, x1, y1, x2, y2, x3, y3, z) {
    b1 = num(x,y, x1, y1, x2, y2) < 0;
    b2 = num(x,y, x2, y2, x3, y3) < 0;
    b3 = num(x,y, x3, y3, x1, y1) < 0;

    return ((b1 == b2) && (b2 == b3));
}

var cc     = 0,
    totest = [],
    avg_zs = [];

function plasma() {
    totest.length = 0;
    avg_zs.length = 0;

    for(i=0;i<4;i++) {

        points = faces[i];
        avg_z  = 0;

        for(k=0;k<3;k++) {

            coords = vert[points[k]];
            z3     = coords[2];
            fox    = fov / (fov + z3);
            x3     = (coords[0] * fox * size) + c_x / 2;
            y3     = (coords[1] * fox * size) + c_y / 2;
            totest.push(x3, y3);
            avg_z += z3;
        }

        avg_zs.push([avg_z / 3, i]);
    }

    totestl = totest.length;
    time   +=5;
    cc      =0.05;
    
    //sort z
    fazez = avg_zs.sort(function(a,b) {
        return a[0] > b[0];
    });

    if(isLittleEndian) {
        for (y = 0; y < c_y; ++y) {

            for (x = 0; x < c_x; ++x) {

                inside = false;

                for(i = 3; i > -1; i--) {
                
                    start = fazez[i][1] * 6;
            
                    if(inside == false) {
                        if(checkpoint(x, y, totest[start], totest[start+1], totest[start+2], totest[start+3], totest[start+4], totest[start+5])) {
                            inside = true;
                            style  = start;
                            break;
                        }
                    }
                }

                if(inside) {
                    a     = 255 & 0xff;
                    value = Math.round(
                                128 + (128 * Math.sin(x / (style + 6) * 1)) + 
                                128 + (128 * Math.sin(y / 8)) + 
                                128 + (128 * Math.sin(Math.sqrt(x * x + y * y) / 32)) 
                                / 3 + time) % 256;

                    r     = 128 + 127 * Math.sin(Math.PI * value / (style * 4)) & 0xff;
                    g     = 128 + 127 * Math.sin(Math.PI * value / 256 - style * 4) & 0xff;
                    b     = style * 6;
                } 
                else {
                    a = 0;
                }

                data32[y * c_x + x] =
                      (a << 24) |
                      (b << 16) |
                      (g <<  8) |
                       r;
            }
        }
    } 
    else {
    //isLittleEndian = false
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
}

function render() {
    update_mouse();
    cube3d();
    requestAnimationFrame(render);
}

function update_mouse() {
    yrspeed = Math.max(-0.3, Math.min(0.3, (mouse.ox - mouse.x)/50));
    xrspeed = Math.max(-0.3, Math.min(0.3, (mouse.oy - mouse.y)/50));
}

window.onload = function() {
    canvas.onmousemove = function(e) {
        mouse.ox = mouse.x;
        mouse.oy = mouse.y;
        mouse.x  = e.pageX - canvas.offsetLeft,
        mouse.y  = e.pageY - canvas.offsetTop;
        e.preventDefault();
    };

    canvas.onmousedown = function(e) {
        mouse.button = e.which;
        mouse.down   = true;
        e.preventDefault();
    };

    canvas.oncontextmenu = function(e) {
        e.preventDefault();
    };

    canvas.onmouseup = function(e) {
        mouse.down = false;
        e.preventDefault();
    };

    render();
}