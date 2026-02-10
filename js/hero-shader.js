/**
 * WebGL Hero Shader - Animated gradient with distortion
 * Inspired by Backhouse.com, adapted for Perun Design palette
 */
(function() {
  const heroShader = document.querySelector('.hero_home_shader');
  const canvas = document.querySelector('.hero_home_canvas');

  if (!heroShader || !canvas || typeof THREE === 'undefined') return;

  function hexToVec3(hex) {
    const color = new THREE.Color(hex);
    return new THREE.Vector3(color.r, color.g, color.b);
  }

  const config = {
    amplitude: 0.65,
    timeSpeed: 0.008,
    color1: '#0a0a0a',
    color2: '#c4e8d4',
    color3: '#9fd9f0',
    color4: '#7a9ba8',
    holdAmplitudeMultiplier: 2,
    holdTimeSpeedMultiplier: 1.5,
    lerpSpeed: 0.03,
    revealDuration: 2,
    revealDelay: 0.3,
    revealEase: 'power2.out'
  };

  const state = {
    isHolding: false,
    currentAmplitude: config.amplitude,
    currentTimeSpeed: config.timeSpeed,
    reveal: 0,
    isComplete: false
  };

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;
    uniform float uTime;
    uniform float uAmplitude;
    uniform vec3 uColors[4];
    uniform float uReveal;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 centeredUv = 2.0 * uv - 1.0;
      float distortionStrength = uAmplitude * uReveal;
      centeredUv += distortionStrength * 0.4 * sin(1.0 * centeredUv.yx + vec2(1.2, 3.4) + uTime);
      centeredUv += distortionStrength * 0.2 * sin(5.2 * centeredUv.yx + vec2(3.5, 0.4) + uTime);
      centeredUv += distortionStrength * 0.3 * sin(3.5 * centeredUv.yx + vec2(1.2, 3.1) + uTime);
      centeredUv += distortionStrength * 1.6 * sin(0.4 * centeredUv.yx + vec2(0.8, 2.4) + uTime);
      vec3 color = uColors[0];
      for(int i = 0; i < 4; i++) {
        float r = cos(float(i) * length(centeredUv));
        color = mix(color, uColors[i], r);
      }
      vec3 black = vec3(0.0);
      gl_FragColor = vec4(mix(black, color, uReveal), 1.0);
    }
  `;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: config.amplitude },
      uReveal: { value: 0 },
      uColors: {
        value: [
          hexToVec3(config.color1),
          hexToVec3(config.color2),
          hexToVec3(config.color3),
          hexToVec3(config.color4)
        ]
      }
    }
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function onHoldStart() {
    state.isHolding = true;
  }

  function onHoldEnd() {
    state.isHolding = false;
  }

  function animate() {
    const targetAmplitude = state.isHolding
      ? config.amplitude * config.holdAmplitudeMultiplier
      : config.amplitude;
    const targetTimeSpeed = state.isHolding
      ? config.timeSpeed * config.holdTimeSpeedMultiplier
      : config.timeSpeed;

    state.currentAmplitude = lerp(state.currentAmplitude, targetAmplitude, config.lerpSpeed);
    state.currentTimeSpeed = lerp(state.currentTimeSpeed, targetTimeSpeed, config.lerpSpeed);

    material.uniforms.uAmplitude.value = state.currentAmplitude;
    material.uniforms.uTime.value += state.currentTimeSpeed;

    renderer.render(scene, camera);
  }

  canvas.addEventListener('mousedown', onHoldStart);
  window.addEventListener('mouseup', onHoldEnd);
  canvas.addEventListener('touchstart', onHoldStart, { passive: true });
  window.addEventListener('touchend', onHoldEnd);
  window.addEventListener('resize', onResize);

  onResize();
  canvas.style.opacity = '1';

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(animate);
    gsap.to(state, {
      reveal: 1,
      duration: config.revealDuration,
      delay: config.revealDelay,
      ease: config.revealEase,
      onUpdate: function() {
        material.uniforms.uReveal.value = state.reveal;
      },
      onComplete: function() {
        state.isComplete = true;
      }
    });
  } else {
    state.reveal = 1;
    material.uniforms.uReveal.value = 1;
    function loop() {
      animate();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
