(function () {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const intro = document.querySelector("[data-scroll-intro]");
  const menuLabel = menuToggle?.querySelector(".visually-hidden");
  const yearTarget = document.querySelector("[data-current-year]");

  if (yearTarget) {
    yearTarget.textContent = String(new Date().getFullYear());
  }

  const setHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  let headerFrame = 0;
  const queueHeaderState = () => {
    if (headerFrame) return;
    headerFrame = requestAnimationFrame(() => {
      headerFrame = 0;
      setHeaderState();
    });
  };

  setHeaderState();
  window.addEventListener("scroll", queueHeaderState, { passive: true });
  window.addEventListener("resize", queueHeaderState);

  const setMenuState = (isOpen, { returnFocus = false } = {}) => {
    nav?.classList.toggle("is-open", isOpen);
    menuToggle?.classList.toggle("is-open", isOpen);
    menuToggle?.setAttribute("aria-expanded", String(isOpen));

    if (menuLabel) {
      menuLabel.textContent = isOpen ? "Close navigation" : "Open navigation";
    }

    if (returnFocus) {
      menuToggle?.focus();
    }
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuState(false);
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen = menuToggle?.getAttribute("aria-expanded") === "true";
    if (isOpen && header && !header.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
      setMenuState(false, { returnFocus: true });
    }
  });

  const desktopQuery = window.matchMedia("(min-width: 761px)");
  const syncDesktopMenu = (event) => {
    if (event.matches) setMenuState(false);
  };

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", syncDesktopMenu);
  } else {
    desktopQuery.addListener(syncDesktopMenu);
  }

  window.lucide?.createIcons({
    attrs: {
      "stroke-width": 2.1
    }
  });

  const navSectionLinks = Array.from(nav?.querySelectorAll('a[href^="#"]') || []);
  const navSections = navSectionLinks
    .map((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    const setActiveNav = (activeSection = null) => {
      navSections.forEach(({ link, section }) => {
        if (section === activeSection) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const navObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!activeEntry) {
        const firstSectionTop = navSections[0].section.offsetTop;
        if (window.scrollY < firstSectionTop - 120) {
          setActiveNav();
        }
        return;
      }

      setActiveNav(activeEntry.target);
    }, {
      rootMargin: "-22% 0px -66% 0px",
      threshold: [0, 0.2, 0.6]
    });

    navSections.forEach(({ section }) => navObserver.observe(section));
  }

  let introScene = null;
  try {
    introScene = initScrollIntroScene();
  } catch (error) {
    console.warn("The 3D intro could not start; using the motion fallback.", error);
    intro?.classList.add("scene-fallback");
  }

  try {
    initMotion(introScene);
  } catch (error) {
    console.warn("Scroll motion could not start; showing the complete static layout.", error);
    activateStaticMotionFallback();
  }
})();

function activateStaticMotionFallback() {
  document.querySelectorAll("[data-reveal]").forEach((item) => {
    item.style.opacity = "1";
    item.style.transform = "none";
  });

  document.querySelector("[data-scroll-intro]")?.classList.add("is-static");

  const processPanel = document.querySelector("[data-process-panel]");
  if (processPanel) {
    processPanel.style.opacity = "1";
    processPanel.style.transform = "none";
  }

  const progressFill = document.querySelector("[data-intro-progress]");
  if (progressFill) {
    progressFill.style.transform = "scaleX(1)";
  }

  const progressStage = document.querySelector("[data-intro-stage]");
  if (progressStage) {
    progressStage.textContent = "04";
  }
}

function initMotion(introScene) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = document.querySelector("[data-scroll-intro]");
  const introHero = document.querySelector("[data-intro-hero]");
  const processPanel = document.querySelector("[data-process-panel]");
  const processSteps = Array.from(document.querySelectorAll(".process-step"));
  const progressFill = document.querySelector("[data-intro-progress]");
  const progressStage = document.querySelector("[data-intro-stage]");
  const atmosphere = document.querySelector(".intro-atmosphere");

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    activateStaticMotionFallback();
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);
  const animatedRevealItems = window.gsap.utils.toArray("[data-reveal]");
  window.gsap.set(animatedRevealItems, { opacity: 0, y: 24 });

  if (intro) {
    let activeStepIndex = -1;

    const syncIntroProgress = (progress) => {
      const phase = window.gsap.utils.clamp(0, 0.999, (progress - 0.2) / 0.67);
      const activeIndex = Math.min(processSteps.length - 1, Math.floor(phase * processSteps.length));

      if (activeIndex !== activeStepIndex) {
        activeStepIndex = activeIndex;
        processSteps.forEach((step, index) => {
          step.classList.toggle("is-active", index === activeIndex);
        });
      }

      if (progressFill) {
        progressFill.style.transform = `scaleX(${progress})`;
      }

      if (progressStage) {
        progressStage.textContent = String(activeIndex + 1).padStart(2, "0");
      }

      if (introHero) {
        introHero.style.pointerEvents = progress > 0.22 ? "none" : "auto";
      }

      introScene?.setProgress(progress);
    };

    const introTimeline = window.gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: intro,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.72,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => syncIntroProgress(self.progress),
        onRefresh: (self) => syncIntroProgress(self.progress)
      }
    });

    if (atmosphere) {
      introTimeline.to(atmosphere, {
        scale: 1.14,
        autoAlpha: 0.76,
        duration: 1
      }, 0);
    }

    if (introHero) {
      introTimeline.to(introHero, {
        autoAlpha: 0,
        "--hero-y": "-92px",
        "--hero-scale": 0.94,
        duration: 0.14
      }, 0.06);
    }

    if (processPanel) {
      introTimeline
        .to(processPanel, {
          autoAlpha: 1,
          "--process-x": "0px",
          "--process-scale": 1,
          duration: 0.13
        }, 0.17)
        .to(processPanel, {
          autoAlpha: 0,
          "--process-x": "-26px",
          "--process-scale": 0.98,
          duration: 0.08
        }, 0.9);
    }

    syncIntroProgress(0);
  }

  animatedRevealItems.forEach((item) => {
    window.gsap.fromTo(item, {
      opacity: 0,
      y: 24
    }, {
      opacity: 1,
      y: 0,
      duration: 0.72,
      ease: "power3.out",
      immediateRender: false,
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        once: true
      }
    });
  });

  window.ScrollTrigger.refresh();
}

function initScrollIntroScene() {
  const canvas = document.getElementById("intro-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || reduceMotion || !window.THREE) {
    return null;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xfafafa, 0.015);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

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

  scene.add(new THREE.AmbientLight(0xffffff, 2.15));

  const sun = new THREE.DirectionalLight(0xffffff, 2.35);
  sun.position.set(3.5, 7, 4);
  scene.add(sun);

  const routeLight = new THREE.PointLight(0x38bdf8, 4.2, 12);
  scene.add(routeLight);

  const signalLight = new THREE.PointLight(0xd6ff62, 2.1, 10);
  signalLight.position.set(-2.4, 1.2, 1.9);
  scene.add(signalLight);

  const world = new THREE.Group();
  world.position.y = -0.18;
  scene.add(world);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 13),
    new THREE.MeshStandardMaterial({
      color: 0xf4f7fb,
      roughness: 0.76,
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
      opacity: 0.42,
      depthWrite: false
    })
  ));

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f7fb,
    emissiveIntensity: 0.1,
    roughness: 0.48,
    metalness: 0.08
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f7fb,
    emissiveIntensity: 0.06,
    roughness: 0.56,
    metalness: 0.04
  });

  const activeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6ff62,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.05,
    roughness: 0.42,
    metalness: 0.05
  });

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0x18181b,
    transparent: true,
    opacity: 0.58,
    depthTest: false,
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

  const routePoints = [
    new THREE.Vector3(-5.8, 0.86, 2.65),
    new THREE.Vector3(-3.65, 0.88, 1.9),
    new THREE.Vector3(-1.7, 0.94, 1.12),
    new THREE.Vector3(0.7, 0.96, -0.55),
    new THREE.Vector3(3.1, 0.94, -1.38),
    new THREE.Vector3(5.0, 0.88, -2.3)
  ];

  const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.42);
  const routeSamples = routeCurve.getPoints(520);
  const dormantLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(routeSamples),
    new THREE.LineBasicMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.2,
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
      size: 0.095,
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
      opacity: 0.22,
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

  const signalRings = routePoints.slice(2).map((point) => {
    const signalRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.26, 40),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      })
    );
    signalRing.rotation.x = -Math.PI / 2;
    signalRing.position.set(point.x, 0.068, point.z);
    signalRing.renderOrder = 12;
    world.add(signalRing);
    return signalRing;
  });

  const trailBeads = Array.from({ length: 5 }, (_, index) => {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.035, 0.085 - index * 0.01), 12, 12),
      new THREE.MeshBasicMaterial({
        color: index < 2 ? 0xd6ff62 : 0x38bdf8,
        transparent: true,
        opacity: 0.78 - index * 0.1,
        depthTest: false,
        depthWrite: false
      })
    );
    bead.renderOrder = 12;
    world.add(bead);
    return bead;
  });

  const pulseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.3, 48),
    new THREE.MeshBasicMaterial({
      color: 0xd6ff62,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    })
  );
  pulseRing.rotation.x = -Math.PI / 2;
  pulseRing.renderOrder = 14;
  world.add(pulseRing);

  let targetProgress = 0;
  let smoothProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let isSceneVisible = true;
  let renderFrame = 0;
  let lastFrameTime = 0;
  let lastRouteEndIndex = -1;
  let lastTailStart = -1;
  let lastRenderedStep = -1;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      isSceneVisible = entries.some((entry) => entry.isIntersecting);
      if (isSceneVisible) {
        startRendering();
      }
    }, { threshold: 0 });
    observer.observe(canvas);
  }

  window.addEventListener("pointermove", (event) => {
    if (!isSceneVisible) return;
    targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startRendering();
    }
  });

  const setProgress = (progress) => {
    targetProgress = Math.max(0, Math.min(1, progress));
    startRendering();
  };

  const resize = () => {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.15 : 1.35);
    renderer.setPixelRatio(pixelRatio);
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
    const tailStart = Math.max(0, endIndex - 42);
    const routeChanged = endIndex !== lastRouteEndIndex;

    if (routeChanged) {
      glowLine.geometry.setDrawRange(0, endIndex);
      routeSparks.geometry.setDrawRange(0, endIndex);
      lastRouteEndIndex = endIndex;
    }

    if (tailStart !== lastTailStart || routeChanged) {
      tailLine.geometry.setDrawRange(tailStart, Math.max(2, endIndex - tailStart));
      lastTailStart = tailStart;
    }

    const point = routeCurve.getPoint(routeProgress);
    pulse.position.copy(point);
    pulseHalo.position.copy(point);
    pulseRing.position.copy(point);
    pulseRing.position.y += 0.03;
    routeLight.position.set(point.x, 1.35, point.z);
    signalLight.position.set(point.x - 0.8, 1.1, point.z + 0.8);

    trailBeads.forEach((bead, index) => {
      const beadProgress = Math.max(0.001, routeProgress - (index + 1) * 0.018);
      const beadPoint = routeCurve.getPoint(beadProgress);
      bead.position.copy(beadPoint);
      bead.visible = routeProgress > (index + 1) * 0.018;
    });

    return point;
  };

  const stepGroups = [aiHub, budgetHub, gymHub, stackHub];

  const clock = new THREE.Clock();

  const render = (frameTime = 0) => {
    renderFrame = 0;
    if (!isSceneVisible || document.hidden) return;

    const frameInterval = 1000 / (window.innerWidth < 760 ? 45 : 55);
    if (lastFrameTime && frameTime - lastFrameTime < frameInterval) {
      startRendering();
      return;
    }
    lastFrameTime = frameTime;

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const progressDamping = 1 - Math.exp(-10 * delta);
    const pointerDamping = 1 - Math.exp(-7 * delta);
    const cameraDamping = 1 - Math.exp(-6.5 * delta);

    smoothProgress += (targetProgress - smoothProgress) * progressDamping;
    pointerX += (targetPointerX - pointerX) * pointerDamping;
    pointerY += (targetPointerY - pointerY) * pointerDamping;

    const point = updateRoute(smoothProgress);
    const sceneProgress = THREE.MathUtils.clamp((smoothProgress - 0.16) / 0.72, 0, 1);
    cameraTarget.lerpVectors(initialTarget, point, sceneProgress);
    smoothTarget.lerp(cameraTarget, cameraDamping);

    const lift = window.innerWidth < 760 ? 0.78 : 0;
    const travelArc = Math.sin(sceneProgress * Math.PI);
    camera.position.set(
      smoothTarget.x + cameraOffset.x - sceneProgress * 0.55 + pointerX * 0.18,
      smoothTarget.y + cameraOffset.y + lift + travelArc * 0.22,
      smoothTarget.z + cameraOffset.z + Math.sin(sceneProgress * Math.PI * 2) * 0.2 - pointerY * 0.16
    );
    camera.lookAt(smoothTarget);

    const nextZoom = 1 + travelArc * 0.055;
    if (Math.abs(camera.zoom - nextZoom) > 0.0005) {
      camera.zoom = nextZoom;
      camera.updateProjectionMatrix();
    }

    world.rotation.y = -0.14 + sceneProgress * 0.08 + pointerX * 0.022;
    world.position.y = -0.18 + travelArc * 0.06;
    aiSymbol.rotation.x = elapsed * 0.85;
    aiSymbol.rotation.y = elapsed * 1.1;
    ring.rotation.z = elapsed * 0.55;

    const activeStep = Math.min(3, Math.max(0, Math.floor(THREE.MathUtils.clamp((smoothProgress - 0.2) / 0.67, 0, 0.999) * 4)));
    stepGroups.forEach((group, index) => {
      const isActive = index === activeStep;
      const targetScale = isActive ? 1.19 : 1;
      scaleTarget.setScalar(targetScale);
      group.scale.lerp(scaleTarget, progressDamping * 0.9);
      group.position.y += ((isActive ? 0.1 : 0) - group.position.y) * progressDamping;
      group.rotation.y += ((isActive ? Math.sin(elapsed * 1.5) * 0.025 : 0) - group.rotation.y) * progressDamping;
    });

    pulse.scale.setScalar(1 + Math.sin(elapsed * 5.2) * 0.18);
    pulseHalo.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.12);
    pulseHalo.material.opacity = 0.18 + Math.sin(elapsed * 3.5) * 0.05;
    pulseRing.scale.setScalar(1.05 + Math.sin(elapsed * 4.2) * 0.18);
    pulseRing.material.opacity = 0.48 + Math.sin(elapsed * 4.2) * 0.14;
    routeLight.intensity = 4 + Math.sin(elapsed * 3.2) * 0.45;

    signalRings.forEach((signalRing, index) => {
      const isActive = index === activeStep;
      const targetScale = isActive ? 1.45 + Math.sin(elapsed * 3.4) * 0.12 : 1;
      const nextScale = signalRing.scale.x + (targetScale - signalRing.scale.x) * progressDamping;
      const targetOpacity = isActive ? 0.62 : index < activeStep ? 0.28 : 0.1;
      signalRing.scale.setScalar(nextScale);
      signalRing.material.opacity += (targetOpacity - signalRing.material.opacity) * progressDamping;
    });

    if (activeStep !== lastRenderedStep) {
      markers.forEach((marker, index) => {
        marker.material.opacity = index <= activeStep ? 1 : 0.36;
      });
      lastRenderedStep = activeStep;
    }

    renderer.render(scene, camera);
    startRendering();
  };

  function startRendering() {
    if (!renderFrame && isSceneVisible && !document.hidden) {
      renderFrame = requestAnimationFrame(render);
    }
  }

  startRendering();

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
    outline.renderOrder = 7;
    outline.scale.set(1.022, 1.026, 1.022);
    outline.position.set(0, 0.006, 0);
    outline.frustumCulled = false;
    mesh.add(outline);
  }
}
