import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';

// 1. Создаем сцену
const scene = new THREE.Scene();

// 2. Камера
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// 3. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.classList.add('canvas-background');
document.body.appendChild(renderer.domElement);

// 4. Шейдерный материал (метаболлы)
const metaballMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(-1, 1) }, // Новая переменная для позиции мыши
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
        uniform vec2 u_mouse; // Новая переменная для позиции мыши
        varying vec2 vUv;

        // Функция метаболлов (капель)
        float metaball(vec2 uv, vec2 pos, float radius) {
          float d = length(uv - pos);
          return radius / (d + d * 0.02); // Чуть изменили коэффициент для четкости
        }

        void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            uv.x *= u_resolution.x / u_resolution.y;

            // Генерируем капли (уменьшенные радиусы)
            float field = 0.0;
            field += metaball(uv, vec2(sin(u_time * 0.1) * 0.6, cos(u_time * 0.1) * 0.6), 0.04);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 1.0) * 0.7, cos(u_time * 0.2 + 1.0) * 0.7), 0.04);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 2.0) * 0.5, cos(u_time * 0.3 + 2.0) * 0.5), 0.05);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 3.0) * 0.8, cos(u_time * 0.5 + 3.0) * 0.8), 0.05);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 4.0) * 0.6, cos(u_time * 0.4 + 4.0) * 0.6), 0.05);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 5.0) * 0.5, cos(u_time * 0.6 + 5.0) * 0.5), 0.05);
            field += metaball(uv, vec2(sin(u_time * 0.1 + 6.0) * 0.7, cos(u_time * 0.8 + 6.0) * 0.7), 0.05);

            // Добавляем каплю, управляемую мышью
            field += metaball(uv, u_mouse, 0.03); // Капля, которая следует за курсором

            // Еще немного увеличим порог слияния для разделения капель
            float alpha = smoothstep(0.6, 0.6, field);

            // Розово-фиолетовый градиент
            vec3 color1 = vec3(1.0, 0.3, 0.7);
            vec3 color2 = vec3(0.5, 0.2, 1.0);
            vec3 color = mix(color1, color2, smoothstep(0.3, 0.7, field));

            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true
});

// 5. Плоскость во весь экран
const planeGeometry = new THREE.PlaneGeometry(2, 2);
const metaballMesh = new THREE.Mesh(planeGeometry, metaballMaterial);
scene.add(metaballMesh);

// 6. Анимация
function animate() {
    metaballMaterial.uniforms.u_time.value += 0.009; // Медленное движение
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
// Переменная для хранения позиции мыши
const mousePosition = new THREE.Vector2();

// Обработчик движения мыши
window.addEventListener('mousemove', (event) => {
    // Преобразуем координаты мыши в нормализованные координаты (-1 до 1)
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Обновляем uniform-переменную в шейдере
    metaballMaterial.uniforms.u_mouse.value = mousePosition;
});
// 7. Обновление экрана при изменении размеров
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    metaballMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});