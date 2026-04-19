import { useEffect, useRef } from "react";

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext("webgl");
    if (!gl) return;
    let W = 0, H = 0, t = 0, animId = 0;
    let R = 300, BOUNDS = 420;
    let rotX = 0.18, rotY = 0, tRX = 0.18, tRY = 0;
    const N = 80000;
    const GRID = 20, G2 = GRID * GRID, G3 = GRID * GRID * GRID;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const mag = new Float32Array(N);
    const field = new Float32Array(G3 * 3);
    const perm = new Uint8Array(512);
    const fade = (t2: number) => t2*t2*t2*(t2*(t2*6-15)+10);
    const lerp = (a: number, b: number, t2: number) => a+(b-a)*t2;
    const grad3 = (h: number, x: number, y: number, z: number) => {
      const u = h<8?x:y, v = h<4?y:h===12||h===14?x:z;
      return ((h&1)?-u:u)+((h&2)?-v:v);
    };
    function initPerm() {
      const p = new Uint8Array(256);
      for (let i=0;i<256;i++) p[i]=i;
      for (let i=255;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); const tmp=p[i]; p[i]=p[j]; p[j]=tmp; }
      for (let i=0;i<512;i++) perm[i]=p[i&255];
    }
    function p3(x: number,y: number,z: number): number {
      const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;
      x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);
      const u=fade(x),v=fade(y),w=fade(z);
      const A=perm[X]+Y,AA=perm[A]+Z,AB=perm[A+1]+Z,B=perm[X+1]+Y,BA=perm[B]+Z,BB=perm[B+1]+Z;
      return lerp(lerp(lerp(grad3(perm[AA],x,y,z),grad3(perm[BA],x-1,y,z),u),lerp(grad3(perm[AB],x,y-1,z),grad3(perm[BB],x-1,y-1,z),u),v),lerp(lerp(grad3(perm[AA+1],x,y,z-1),grad3(perm[BA+1],x-1,y,z-1),u),lerp(grad3(perm[AB+1],x,y-1,z-1),grad3(perm[BB+1],x-1,y-1,z-1),u),v),w);
    }
    const n3 = (x: number,y: number,z: number,s: number) => p3(x*s,y*s,z*s)+p3(x*s*2.1,y*s*2.1,z*s*2.1)*0.5+p3(x*s*4.3,y*s*4.3,z*s*4.3)*0.25;
    function genField() {
      initPerm();
      const sc=0.12;
      for (let z=0;z<GRID;z++) for (let y=0;y<GRID;y++) for (let x=0;x<GRID;x++) {
        const idx=(z*G2+y*GRID+x)*3;
        const fx=n3(x+1.7,y,z,sc)-n3(x-1.7,y,z,sc);
        const fy=n3(x,y+1.7,z,sc)-n3(x,y-1.7,z,sc);
        const fz=n3(x,y,z+1.7,sc)-n3(x,y,z-1.7,sc);
        field[idx]=fy*0.3-fz*0.5+n3(x,y+3.4,z+5.8,sc*0.5);
        field[idx+1]=fz*0.3-fx*0.5+n3(x+4.1,y,z+2.7,sc*0.5);
        field[idx+2]=fx*0.3-fy*0.5+n3(x+8.3,y+2.1,z,sc*0.5);
        const len=Math.sqrt(field[idx]**2+field[idx+1]**2+field[idx+2]**2)||1;
        field[idx]/=len;field[idx+1]/=len;field[idx+2]/=len;
      }
    }
    function initParts() {
      for (let i=0;i<N;i++) {
        const phi=Math.acos(1-2*Math.random()),theta=Math.random()*Math.PI*2;
        const r=R*Math.pow(Math.random(),0.4);
        pos[i*3]=r*Math.sin(phi)*Math.cos(theta);
        pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*0.75;
        pos[i*3+2]=r*Math.cos(phi);
        vel[i*3]=(Math.random()-.5)*.08;
        vel[i*3+1]=(Math.random()-.5)*.08;
        vel[i*3+2]=(Math.random()-.5)*.08;
      }
    }
    const MS=0.72,GV=0.013,OB=0.005,PW=0.002,PP=0.022,BS=0.0028,OBB=0.008;
    function update() {
      const np=(Math.sin(t*BS)+1)*0.5;
      const ps=PW+(PP-PW)*np;
      const os=OB+OBB*(1-np);
      for (let i=0;i<N;i++) {
        const px=pos[i*3],py=pos[i*3+1],pz=pos[i*3+2];
        let gx=Math.floor(((px+BOUNDS)/(2*BOUNDS))*(GRID-1));
        let gy=Math.floor(((py+BOUNDS)/(2*BOUNDS))*(GRID-1));
        let gz=Math.floor(((pz+BOUNDS)/(2*BOUNDS))*(GRID-1));
        gx=Math.max(0,Math.min(GRID-1,gx));
        gy=Math.max(0,Math.min(GRID-1,gy));
        gz=Math.max(0,Math.min(GRID-1,gz));
        const fi=(gz*G2+gy*GRID+gx)*3;
        vel[i*3]+=field[fi]*ps;vel[i*3+1]+=field[fi+1]*ps;vel[i*3+2]+=field[fi+2]*ps;
        const dist=Math.sqrt(px*px+py*py+pz*pz)||1;
        vel[i*3]-=(px/dist)*GV;vel[i*3+1]-=(py/dist)*GV;vel[i*3+2]-=(pz/dist)*GV;
        const tx=py*0.1-pz*1.0,ty=pz*0.15-px*0.1,tz=px*1.0-py*0.15;
        const tl=Math.sqrt(tx*tx+ty*ty+tz*tz)||1;
        vel[i*3]+=(tx/tl)*os;vel[i*3+1]+=(ty/tl)*os;vel[i*3+2]+=(tz/tl)*os;
        const sp=Math.sqrt(vel[i*3]**2+vel[i*3+1]**2+vel[i*3+2]**2);
        if(sp>MS){const s=MS/sp;vel[i*3]*=s;vel[i*3+1]*=s;vel[i*3+2]*=s;}
        mag[i]=sp/MS;
        pos[i*3]+=vel[i*3];pos[i*3+1]+=vel[i*3+1];pos[i*3+2]+=vel[i*3+2];
        if(dist>BOUNDS){
          const phi=Math.acos(1-2*Math.random()),theta=Math.random()*Math.PI*2,r=R*0.5*Math.random();
          pos[i*3]=r*Math.sin(phi)*Math.cos(theta);pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta);pos[i*3+2]=r*Math.cos(phi);
          vel[i*3]=(Math.random()-.5)*.08;vel[i*3+1]=(Math.random()-.5)*.08;vel[i*3+2]=(Math.random()-.5)*.08;
        }
      }
    }
    const VS=`attribute vec3 aPos;attribute float aMag;uniform mat4 uRot;uniform vec2 uRes;varying float vMag;varying float vA;void main(){vec4 rp=uRot*vec4(aPos,1.0);float fov=520.0;float zz=rp.z+fov;float depth=(rp.z+300.0)/600.0;gl_Position=vec4((rp.x*fov/zz)/(uRes.x*.5),-(rp.y*fov/zz)/(uRes.y*.5),0.0,1.0);gl_PointSize=(0.35+aMag*1.7)*(0.4+depth*0.9)*(uRes.x/1100.0);vMag=aMag;vA=(0.1+depth*0.72)*(0.22+aMag*0.78);}`;
    const FS=`precision mediump float;varying float vMag;varying float vA;void main(){vec2 c=gl_PointCoord-.5;if(length(c)>.5)discard;float a=(1.0-length(c)*2.0)*vA;vec3 v=vec3(0.01,0.04,0.04);vec3 d=vec3(0.04,0.10,0.10);vec3 m=vec3(0.18,0.38,0.36);vec3 pr=vec3(0.365,0.6,0.573);vec3 b=vec3(0.52,0.82,0.76);vec3 sg=vec3(0.72,0.92,0.86);vec3 am=vec3(0.88,0.48,0.03);vec3 col;if(vMag<0.15)col=mix(v,d,vMag/0.15);else if(vMag<0.35)col=mix(d,m,(vMag-0.15)/0.20);else if(vMag<0.55)col=mix(m,pr,(vMag-0.35)/0.20);else if(vMag<0.75)col=mix(pr,b,(vMag-0.55)/0.20);else if(vMag<0.92)col=mix(b,sg,(vMag-0.75)/0.17);else col=mix(sg,am,(vMag-0.92)/0.08);gl_FragColor=vec4(col*1.15,a);}`;
    function mkShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s,src);gl!.compileShader(s);return s;
    }
    function mkRot(rx: number,ry: number){
      const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
      return new Float32Array([cy,0,sy,0,sx*sy,cx,-sx*cy,0,-cx*sy,sx,cx*cy,0,0,0,0,1]);
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog,mkShader(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,mkShader(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(prog);gl.useProgram(prog);
    const uRot=gl.getUniformLocation(prog,"uRot");
    const uRes=gl.getUniformLocation(prog,"uRes");
    const posBuf=gl.createBuffer()!;
    const magBuf=gl.createBuffer()!;
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
    function resize() {
      const p = cv!.parentElement;
      if (!p) return;
      W=cv!.width=p.offsetWidth;
      H=cv!.height=p.offsetHeight||window.innerHeight;
      R=Math.max(W,H)*0.62;
      BOUNDS=R*1.15;
      gl!.viewport(0,0,W,H);
      initParts();
    }
    const onMM = (e: MouseEvent) => {
      const r=cv!.getBoundingClientRect();
      tRX=(e.clientY-r.top)/H*0.45-0.22;
      tRY=(e.clientX-r.left)/W*1.5-0.75;
    };
    cv.addEventListener("mousemove",onMM);
    function tick() {
      rotX+=(tRX+0.15-rotX)*0.012;
      rotY+=(tRY+t*0.001-rotY)*0.012;
      update();
      gl!.clearColor(0,0,0,1);gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.useProgram(prog);
      gl!.uniformMatrix4fv(uRot,false,mkRot(rotX,rotY));
      gl!.uniform2f(uRes,W,H);
      gl!.bindBuffer(gl!.ARRAY_BUFFER,posBuf);gl!.bufferData(gl!.ARRAY_BUFFER,pos,gl!.DYNAMIC_DRAW);
      const pL=gl!.getAttribLocation(prog,"aPos");gl!.enableVertexAttribArray(pL);gl!.vertexAttribPointer(pL,3,gl!.FLOAT,false,0,0);
      gl!.bindBuffer(gl!.ARRAY_BUFFER,magBuf);gl!.bufferData(gl!.ARRAY_BUFFER,mag,gl!.DYNAMIC_DRAW);
      const mL=gl!.getAttribLocation(prog,"aMag");gl!.enableVertexAttribArray(mL);gl!.vertexAttribPointer(mL,1,gl!.FLOAT,false,0,0);
      gl!.drawArrays(gl!.POINTS,0,N);
      t+=0.2;
      animId=requestAnimationFrame(tick);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement || document.body);
    resize();genField();tick();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      cv.removeEventListener("mousemove",onMM);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block" }}
    />
  );
}
