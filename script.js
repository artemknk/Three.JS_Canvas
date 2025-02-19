import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';

// 1. Создаем сцену
const scene = new THREE.Scene();
scene.background = new THREE.Color(0.02, 0.05, 0.12);

// 2. Камера
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// 3. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Делаем рендер через `position: fixed`, чтобы он был фоном
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100vw";
renderer.domElement.style.height = "100vh";
renderer.domElement.style.zIndex = "-1";
document.body.appendChild(renderer.domElement);

// 4. Шейдерный материал (метаболлы)
const metaballMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.0, 0.0) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 vUv;

// Функция метаболлов (капель)
float metaball(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return radius / (d + 0.02);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Генерируем капли
    float field = 0.0;
    field += metaball(uv, u_mouse, 0.06);
    for (int i = 0; i < 7; i++) {
        float phase = float(i) * 1.2;
        float speedFactor = 0.05 + 0.04 * mod(float(i), 9.0);
        vec2 pos = vec2(sin(u_time * speedFactor + phase), cos(u_time * (0.15 + 0.1 * float(i)) + phase)) * (0.6 + 0.2 * mod(float(i), 2.0)); 
        field += metaball(uv, pos, 0.05);
    }

    // **Объём через светотень**
    float light = smoothstep(0.6, 0.75, field) * 0.9; // Мягкий свет сверху
    float shadow = smoothstep(0.4, 0.6, field) * 0.1; // Тень снизу

    // **Чистый цвет капель**
    vec3 dropColor = vec3(0.0, 0.7, 0.8); // Чистый бирюзовый

    // **Финальный цвет с объёмом**
    vec3 finalColor = dropColor + vec3(light) - vec3(shadow);

    // **Чёткие границы и матовая поверхность**
    float alpha = smoothstep(0.55, 0.7, field); // Резкие края без размытия

    gl_FragColor = vec4(finalColor, alpha);
}
    `,
    transparent: true
});

// 6. Создаем рендер-таргет для капель
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
});

// 7. Плоскость для капель
const planeGeometry = new THREE.PlaneGeometry(2, 2);
const metaballMesh = new THREE.Mesh(planeGeometry, metaballMaterial);
scene.add(metaballMesh);

// 9. Анимация
function animate() {
    metaballMaterial.uniforms.u_time.value += 0.009; // Медленное движение
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// 10. Управление мышью
window.addEventListener("mousemove", (e) => {
    let x = (e.clientX / window.innerWidth) * 2.0 - 1.0;
    let y = -(e.clientY / window.innerHeight) * 2.0 + 1.0;
    metaballMaterial.uniforms.u_mouse.value.set(x, y);
});

// 11. Обновление экрана при изменении размеров
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    metaballMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    renderTarget.setSize(window.innerWidth, window.innerHeight);
});