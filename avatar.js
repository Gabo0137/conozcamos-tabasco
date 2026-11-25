const canvas = document.getElementById('heroAvatarCanvas');
const container = document.querySelector('.hero-avatar-container');

if (canvas && container && window.THREE?.GLTFLoader) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene.add(new THREE.HemisphereLight(0xDAF1DE, 0x051F20, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(2.5, 4.5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8EB69B, 1.4);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const avatarRoot = new THREE.Group();
    scene.add(avatarRoot);
    let mixer = null;
    let originalAction = null;
    let introRunning = false;
    let resolveModelReady;
    const modelReady = new Promise(resolve => { resolveModelReady = resolve; });
    window.avatarReady = modelReady;

    window.startAvatarAnimation = async (duration = 25000) => {
        if (introRunning) return;
        introRunning = true;
        const loaded = await modelReady;
        if (loaded && originalAction) {
            originalAction.reset();
            originalAction.paused = false;
            originalAction.setLoop(THREE.LoopRepeat, Infinity);
            originalAction.play();
            await new Promise(resolve => window.setTimeout(resolve, duration));
            originalAction.paused = true;
        }
        introRunning = false;
    };

    function resize() {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function frameModel(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.05 / Math.max(size.y, 0.001);
        object.scale.setScalar(scale);
        object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        camera.position.set(0, 1.05, 5.1);
        camera.lookAt(0, 1.05, 0);
    }

    new THREE.GLTFLoader().load('IguanitaTam.glb', gltf => {
        const model = gltf.scene;
        model.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        avatarRoot.add(model);
        frameModel(model);

        if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            const agreementAnimation = gltf.animations.find(clip => clip.name === 'Agree_Gesture');
            originalAction = mixer.clipAction(agreementAnimation || gltf.animations[0]);
            originalAction.reset();
            originalAction.setLoop(THREE.LoopRepeat, Infinity);
            originalAction.play();
            mixer.update(0);
            originalAction.paused = true;
        }
        resolveModelReady(true);
        resize();
    }, undefined, error => {
        console.error('No se pudo cargar IguanitaTam.glb', error);
        resolveModelReady(false);
    });

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const clock = new THREE.Clock();

    function render() {
        requestAnimationFrame(render);
        if (mixer) mixer.update(Math.min(clock.getDelta(), 0.05));
        renderer.render(scene, camera);
    }

    resize();
    render();
}
