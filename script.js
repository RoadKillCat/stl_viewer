'use strict';

let cont = document.getElementById('cont');
let inpt = document.getElementById('inpt');
let disp = document.getElementById('disp');
let cnvs = document.getElementById('cnvs');
let ctx = cnvs.getContext('2d');
let settings = document.getElementById('settings');

let world = [];
let wireframe = true;
let cam = {x: 0, y: -40, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 60};
let m_damp = 400;
let set_w = 400;

let inputs = document.getElementsByTagName('input');
for (var i = 0; i < inputs.length; i++){
    if (inputs[i].type == 'range'){
        inputs[i].style.width = set_w / 2;
    }
}

inpt.addEventListener('change', function (e){
    let r = new FileReader();
    r.onload = function(){
        world = read_binary_stl(this.result);
        center_world();
        disp.style.display = 'block';
        cont.style.display = 'none';
        resize();
        update();
        window.addEventListener('resize', resize);
        cnvs.addEventListener('mousedown', md);
    }
    r.readAsArrayBuffer(e.target.files[0]);
});

function update(){
    zengine.render(world, cam, cnvs, wireframe);
}

function center_world(){
    let center = {x: 0, y: 0, z: 0}
    for (let f = 0; f < world.length; f++){
        let c = zengine.centroid(world[f].verts);
        center.x += c.x;
        center.y += c.y;
        center.z += c.z;
    }
    center.x /= world.length;
    center.y /= world.length;
    center.z /= world.length;
    world = world.map(f=>({verts: f.verts.map(zengine.translate(-center.x, -center.y, -center.z)),
                           col: f.col}));
}

function read_binary_stl(f){
    let dv = new DataView(f);
    //assuming binary .stl file, add in ASCII support later
    let pointer = 80;
    let no_faces = dv.getUint32(pointer, true);
    pointer += 4;
    let world = [];
    for (let f = 0; f < no_faces; f++){
        let verts = [];
        pointer += 12;
        for (let v = 0; v < 3; v++){
            verts.push({x: dv.getFloat32(pointer,   true),
                        y: dv.getFloat32(pointer+4, true),
                        z: dv.getFloat32(pointer+8, true)});
            pointer += 12;
        }
        world.push({verts: verts, col: '#fff'});
        let atbc = dv.getUint16(pointer, true);
        if (atbc != 0) throw Error('attribute byte count not 0');
        pointer += 2;
    }
    return world;
}

/*  mouse events  */
function md(e){
    cnvs.style.cursor = '-webkit-grabbing';
    cnvs.addEventListener('mouseup',   mu);
    cnvs.addEventListener('mousemove', mm);
    cnvs.removeEventListener('mousedown', md);
}

function mu(){
    cnvs.style.cursor = '-webkit-grab';
    cnvs.removeEventListener('mousemove', mm);
    cnvs.addEventListener('mousedown', md);
    cnvs.removeEventListener('mouseup', mu);
}

function mm(e){
    var dx = e.movementX / m_damp;
    var dy = e.movementY / m_damp;
    world = world.map(f=>({verts: f.verts.map(zengine.z_axis_rotate(dx))
                                         .map(zengine.x_axis_rotate(dy * -1)),
                           col: f.col}));
    update();
}

function resize(){
    cnvs.width = innerWidth - set_w;
    cnvs.height = innerHeight;
    update();
}
