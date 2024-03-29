// Adapted from https://github.com/davepagurek/p5.Framebuffer for my own needs.

class SwapableTexture {
  constructor(target) {
    this.src = new Framebuffer(target);
    this.dst = new Framebuffer(target);
  }
  swap() {
    var tmp = this.src;
    this.src = this.dst;
    this.dst = tmp;
  }
}

class RawTextureWrapper extends p5.Texture {
  constructor(renderer, obj, w, h) {
    super(renderer, obj);
    this.width = w;
    this.height = h;
    return this;
  }

  _getTextureDataFromSource() {
    return this.src;
  }

  init(tex) {
    const gl = this._renderer.GL;
    this.glTex = tex;

    this.glWrapS = this._renderer.textureWrapX;
    this.glWrapT = this._renderer.textureWrapY;
    this.setWrapMode(this.glWrapS, this.glWrapT);
    this.setInterpolation(this.glMinFilter, this.glMagFilter);
  }

  update() {
    return false;
  }
}

class Framebuffer {
  constructor(canvas, options) {
    this._renderer = canvas._renderer;
    const gl = this._renderer.GL;
    const width = this._renderer.width;
    const height = this._renderer.height;
    const density = this._renderer._pInst._pixelDensity;

    // an emprcolor buffer
    const colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width * density,
      height * density,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );

    // Create the depth texture
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT,
      width * density,
      height * density,
      0,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_SHORT,
      null
    );

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      colorTexture,
      0
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      depthTexture,
      0
    );

    const depthP5Texture = new RawTextureWrapper(
      this._renderer,
      depthTexture,
      width * density,
      height * density
    );
    this._renderer.textures.push(depthP5Texture);

    const colorP5Texture = new RawTextureWrapper(
      this._renderer,
      colorTexture,
      width * density,
      height * density
    );
    this._renderer.textures.push(colorP5Texture);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.framebuffer = framebuffer;
    this.depth = depthTexture;
    this.color = colorTexture;
    this.gl = gl;
  }

  draw(cb) {
    this._renderer.GL.bindFramebuffer(
      this._renderer.GL.FRAMEBUFFER,
      this.framebuffer
    );
    cb();
    // this._renderer.GL.shader = null;
    this._renderer.GL.bindFramebuffer(this._renderer.GL.FRAMEBUFFER, null);
  }
}
