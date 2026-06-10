(function () {
  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const intro = document.querySelector("[data-scroll-intro]");

  const setHeaderState = () => {
    const introEnd = intro ? intro.offsetTop + intro.offsetHeight - window.innerHeight * 0.22 : 0;
    const isInIntro = Boolean(intro && window.scrollY < introEnd);
    header?.classList.toggle("is-in-intro", isInIntro);
    header?.classList.toggle("is-scrolled", window.scrollY > 12 && !isInIntro);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", setHeaderState);

  document.addEventListener("pointermove", (event) => {
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    root.style.setProperty("--pointer-x", `${x}%`);
    root.style.setProperty("--pointer-y", `${y}%`);
  });

  menuToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", isOpen ? "x" : "menu");
      window.lucide?.createIcons();
    }
  });

  nav?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      const icon = menuToggle?.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        window.lucide?.createIcons();
      }
    }
  });

  window.lucide?.createIcons({
    attrs: {
      "stroke-width": 2.1
    }
  });

  const introScene = initScrollIntroScene();
  initMotion(introScene);
})();

function initMotion(introScene) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll("[data-reveal]");
  const intro = document.querySelector("[data-scroll-intro]");
  const introHero = document.querySelector("[data-intro-hero]");
  const processPanel = document.querySelector("[data-process-panel]");
  const processSteps = Array.from(document.querySelectorAll(".process-step"));

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    revealItems.forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "none";
    });
    intro?.classList.add("is-static");
    if (processPanel) {
      processPanel.style.opacity = "1";
      processPanel.style.transform = "none";
    }
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  if (intro) {
    let lastIntroProgress = -1;

    const getIntroProgress = () => {
      const travel = Math.max(1, intro.offsetHeight - window.innerHeight);
      return window.gsap.utils.clamp(0, 1, (window.scrollY - intro.offsetTop) / travel);
    };

    const updateProcess = () => {
      const progress = getIntroProgress();
      if (Math.abs(progress - lastIntroProgress) < 0.0005) {
        return;
      }
      lastIntroProgress = progress;

      const phase = window.gsap.utils.clamp(0, 0.999, (progress - 0.2) / 0.67);
      const activeIndex = Math.min(processSteps.length - 1, Math.floor(phase * processSteps.length));
      const heroExit = window.gsap.utils.clamp(0, 1, (progress - 0.08) / 0.14);
      const processEnter = window.gsap.utils.clamp(0, 1, (progress - 0.16) / 0.08);
      const processExit = window.gsap.utils.clamp(0, 1, (progress - 0.93) / 0.05);
      const processOpacity = processEnter * (1 - processExit);
      const processX = -24 * (1 - processEnter) - 18 * processExit;

      if (introHero) {
        introHero.style.opacity = String(1 - heroExit);
        introHero.style.transform = `translate(-50%, calc(-50% - ${78 * heroExit}px)) scale(${1 - 0.04 * heroExit})`;
        introHero.style.pointerEvents = heroExit > 0.92 ? "none" : "auto";
      }

      if (processPanel) {
        processPanel.style.opacity = processOpacity.toFixed(3);
        processPanel.style.setProperty("--process-x", `${processX.toFixed(2)}px`);
      }

      processSteps.forEach((step, index) => {
        step.classList.toggle("is-active", index === activeIndex);
      });

      introScene?.setProgress(progress);
    };

    window.addEventListener("scroll", updateProcess, { passive: true });
    document.addEventListener("scroll", updateProcess, { passive: true, capture: true });
    window.addEventListener("resize", updateProcess);
    window.setInterval(updateProcess, 90);
    const syncIntro = () => {
      updateProcess();
      requestAnimationFrame(syncIntro);
    };
    syncIntro();
  }

  window.gsap.utils.toArray("[data-reveal]").forEach((item) => {
    window.gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.72,
      ease: "power3.out",
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        once: true
      }
    });
  });

  window.gsap.utils.toArray(".project-card").forEach((card) => {
    const visual = card.querySelector(".project-visual");
    if (!visual) {
      return;
    }

    window.gsap.to(visual, {
      yPercent: -7,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });
}

function initScrollIntroScene() {
  const canvas = document.getElementById("intro-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || reduceMotion || !window.THREE) {
    return null;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xdbeafe, 0.018);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = false;
  if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 100);
  const cameraTarget = new THREE.Vector3(0, 0, 0);
  const smoothTarget = new THREE.Vector3(0, 0, 0);
  const cameraOffset = new THREE.Vector3(5.7, 6.8, 6.2);
  const initialTarget = new THREE.Vector3(-1.05, 0.1, 0.58);
  const scaleTarget = new THREE.Vector3(1, 1, 1);

  scene.add(new THREE.AmbientLight(0xffffff, 2.35));

  const sun = new THREE.DirectionalLight(0xffffff, 2.7);
  sun.position.set(3.5, 7, 4);
  scene.add(sun);

  const cyanLight = new THREE.PointLight(0x38bdf8, 4.5, 12);
  scene.add(cyanLight);

  const limeLight = new THREE.PointLight(0xd6ff62, 2.1, 10);
  limeLight.position.set(-2.4, 1.2, 1.9);
  scene.add(limeLight);

  const world = new THREE.Group();
  world.position.y = -0.18;
  scene.add(world);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 13),
    new THREE.MeshStandardMaterial({
      color: 0xc7e4f6,
      roughness: 0.72,
      metalness: 0.02
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  ground.receiveShadow = true;
  world.add(ground);

  const dotPositions = [];
  for (let x = -7.2; x <= 7.2; x += 0.52) {
    for (let z = -4.6; z <= 4.6; z += 0.52) {
      const distance = Math.hypot(x * 0.78, z);
      if (distance < 4.7 || Math.random() > 0.88) {
        dotPositions.push(x, 0.03, z);
      }
    }
  }

  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dotPositions, 3));
  world.add(new THREE.Points(
    dotGeometry,
    new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.055,
      transparent: true,
      opacity: 0.64,
      depthWrite: false
    })
  ));

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7e4f6,
    emissive: 0x2563eb,
    emissiveIntensity: 0.08,
    roughness: 0.48,
    metalness: 0.08
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x2563eb,
    emissiveIntensity: 0.14,
    roughness: 0.56,
    metalness: 0.04
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.03,
    transparent: true,
    opacity: 0.58
  });

  const activeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6ff62,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.2,
    roughness: 0.42,
    metalness: 0.05
  });

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0x0f3f69,
    transparent: true,
    opacity: 0.46,
    depthTest: true,
    depthWrite: false
  });

  const blocks = [];
  const addBlock = (x, z, width, depth, height, material = baseMaterial) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh);
    world.add(mesh);
    blocks.push(mesh);
    return mesh;
  };

  addBlock(-5.7, 2.6, 0.7, 0.9, 0.34);
  addBlock(-4.8, 2.35, 0.62, 0.7, 0.24);
  addBlock(-3.2, -3.0, 0.66, 1.1, 0.36);
  addBlock(-2.4, -3.1, 0.72, 1.05, 0.42);
  addBlock(3.9, 2.5, 0.95, 1.2, 0.42);
  addBlock(5.2, 1.9, 1.2, 0.78, 0.32);
  addBlock(5.6, -2.9, 0.62, 0.84, 0.28);

  const aiHub = new THREE.Group();
  aiHub.position.set(-1.7, 0, 1.12);
  world.add(aiHub);
  addGroupedBlock(aiHub, 0, 0, 1.35, 1.1, 0.76, baseMaterial);
  addGroupedBlock(aiHub, 0.95, -0.05, 0.58, 1.02, 0.5, accentMaterial);
  addGroupedBlock(aiHub, -0.9, 0.02, 0.54, 0.96, 0.46, accentMaterial);
  const aiSymbol = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.24, 1),
    activeMaterial
  );
  aiSymbol.position.set(0, 1.0, 0);
  aiHub.add(aiSymbol);

  const budgetHub = new THREE.Group();
  budgetHub.position.set(0.7, 0, -0.55);
  world.add(budgetHub);
  addGroupedBlock(budgetHub, 0, 0, 1.8, 1.18, 0.58, baseMaterial);
  for (let i = 0; i < 6; i += 1) {
    const h = 0.28 + i * 0.09;
    addGroupedBlock(budgetHub, -0.68 + i * 0.27, -0.74, 0.12, 0.16, h, i % 2 ? activeMaterial : accentMaterial, false);
  }

  const gymHub = new THREE.Group();
  gymHub.position.set(3.1, 0, -1.38);
  world.add(gymHub);
  addGroupedBlock(gymHub, 0, 0, 1.15, 0.95, 0.35, baseMaterial);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.035, 12, 54),
    activeMaterial
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.55, 0);
  gymHub.add(ring);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.92), activeMaterial);
  bar.rotation.y = -0.65;
  bar.position.set(0, 0.56, 0);
  gymHub.add(bar);

  const stackHub = new THREE.Group();
  stackHub.position.set(5.0, 0, -2.3);
  world.add(stackHub);
  for (let x = -0.45; x <= 0.45; x += 0.3) {
    for (let z = -0.38; z <= 0.38; z += 0.38) {
      addGroupedBlock(stackHub, x, z, 0.2, 0.24, 0.28 + Math.abs(x) * 0.28, baseMaterial, false);
    }
  }

  const glassPlates = [
    [-1.7, 1.12, 2.9, 2.4],
    [0.7, -0.55, 3.3, 2.3],
    [3.1, -1.38, 2.4, 2.0]
  ];
  glassPlates.forEach(([x, z, width, depth]) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, depth), glassMaterial);
    plate.position.set(x, 0.045, z);
    world.add(plate);
  });

  const routePoints = [
    new THREE.Vector3(-5.8, 0.36, 2.65),
    new THREE.Vector3(-3.65, 0.38, 1.9),
    new THREE.Vector3(-1.7, 0.42, 1.12),
    new THREE.Vector3(0.7, 0.44, -0.55),
    new THREE.Vector3(3.1, 0.42, -1.38),
    new THREE.Vector3(5.0, 0.38, -2.3)
  ];

  const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.42);
  const routeSamples = routeCurve.getPoints(520);
  const dormantLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(routeSamples),
    new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false
    })
  );
  dormantLine.renderOrder = 8;
  world.add(dormantLine);

  const glowGeometry = new THREE.BufferGeometry().setFromPoints(routeSamples);
  glowGeometry.setDrawRange(0, 2);
  const glowLine = new THREE.Line(
    glowGeometry,
    new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false
    })
  );
  glowLine.renderOrder = 10;
  world.add(glowLine);

  const routeSparkGeometry = new THREE.BufferGeometry().setFromPoints(routeSamples);
  routeSparkGeometry.setDrawRange(0, 2);
  const routeSparks = new THREE.Points(
    routeSparkGeometry,
    new THREE.PointsMaterial({
      color: 0xd6ff62,
      size: 0.075,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
      depthWrite: false
    })
  );
  routeSparks.renderOrder = 11;
  world.add(routeSparks);

  const tailGeometry = new THREE.BufferGeometry().setFromPoints(routeSamples);
  tailGeometry.setDrawRange(0, 2);
  const tailLine = new THREE.Line(
    tailGeometry,
    new THREE.LineBasicMaterial({
      color: 0xd6ff62,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
      depthWrite: false
    })
  );
  tailLine.renderOrder = 12;
  world.add(tailLine);

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xd6ff62,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false
    })
  );
  pulse.renderOrder = 13;
  world.add(pulse);

  const pulseHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      depthTest: false,
      depthWrite: false
    })
  );
  pulseHalo.renderOrder = 9;
  world.add(pulseHalo);

  const markers = routePoints.slice(2).map((point) => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.025, 32),
      new THREE.MeshBasicMaterial({
        color: 0xd6ff62,
        transparent: true,
        opacity: 0.72
      })
    );
    marker.position.set(point.x, 0.052, point.z);
    world.add(marker);
    return marker;
  });

  let targetProgress = 0;
  let smoothProgress = 0;
  let pointerX = 0;
  let pointerY = 0;

  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const setProgress = (progress) => {
    targetProgress = Math.max(0, Math.min(1, progress));
  };

  const resize = () => {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    renderer.setSize(width, height, false);

    const aspect = width / height;
    const isMobile = width < 760;
    const viewHeight = isMobile ? 6.2 : 7.2;
    camera.left = -viewHeight * aspect * 0.5;
    camera.right = viewHeight * aspect * 0.5;
    camera.top = viewHeight * 0.5;
    camera.bottom = -viewHeight * 0.5;
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener("resize", resize);

  const updateRoute = (progress) => {
    const routeProgress = THREE.MathUtils.clamp((progress - 0.12) / 0.78, 0.001, 1);
    const endIndex = Math.max(2, Math.floor(routeProgress * (routeSamples.length - 1)));
    glowLine.geometry.setDrawRange(0, endIndex);
    routeSparks.geometry.setDrawRange(0, endIndex);

    const tailStart = Math.max(0, endIndex - 42);
    tailLine.geometry.setDrawRange(tailStart, Math.max(2, endIndex - tailStart));

    const point = routeCurve.getPoint(routeProgress);
    pulse.position.copy(point);
    pulseHalo.position.copy(point);
    cyanLight.position.set(point.x, 1.35, point.z);
    limeLight.position.set(point.x - 0.8, 1.1, point.z + 0.8);

    return point;
  };

  const stepGroups = [aiHub, budgetHub, gymHub, stackHub];

  const clock = new THREE.Clock();

  const render = () => {
    const elapsed = clock.getElapsedTime();
    smoothProgress += (targetProgress - smoothProgress) * 0.07;

    const point = updateRoute(smoothProgress);
    const sceneProgress = THREE.MathUtils.clamp((smoothProgress - 0.16) / 0.72, 0, 1);
    cameraTarget.lerpVectors(initialTarget, point, sceneProgress);
    smoothTarget.lerp(cameraTarget, 0.08);

    const lift = window.innerWidth < 760 ? 0.78 : 0;
    camera.position.set(
      smoothTarget.x + cameraOffset.x + pointerX * 0.14,
      smoothTarget.y + cameraOffset.y + lift,
      smoothTarget.z + cameraOffset.z - pointerY * 0.12
    );
    camera.lookAt(smoothTarget);

    world.rotation.y = -0.12 + pointerX * 0.015;
    aiSymbol.rotation.x = elapsed * 0.85;
    aiSymbol.rotation.y = elapsed * 1.1;
    ring.rotation.z = elapsed * 0.55;

    const activeStep = Math.min(3, Math.max(0, Math.floor(THREE.MathUtils.clamp((smoothProgress - 0.2) / 0.67, 0, 0.999) * 4)));
    stepGroups.forEach((group, index) => {
      const targetScale = index === activeStep ? 1.16 : 1;
      scaleTarget.setScalar(targetScale);
      group.scale.lerp(scaleTarget, 0.08);
    });

    pulse.scale.setScalar(1 + Math.sin(elapsed * 5.2) * 0.18);
    pulseHalo.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.12);
    markers.forEach((marker, index) => {
      marker.material.opacity = index <= activeStep ? 1 : 0.36;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();

  return { setProgress };

  function addGroupedBlock(group, x, z, width, depth, height, material, shouldOutline = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (shouldOutline) {
      addOutline(mesh);
    }
    group.add(mesh);
    blocks.push(mesh);
    return mesh;
  }

  function addOutline(mesh) {
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), outlineMaterial);
    outline.renderOrder = 4;
    outline.scale.set(1.014, 1.018, 1.014);
    outline.position.set(0, 0.003, 0);
    mesh.add(outline);
  }
}
