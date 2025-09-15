document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = 1
  document.querySelectorAll('[data-animation="type-loop"]').forEach((el) => {
    const strings = el.dataset.typingStrings?.split('|') || ['Hello!'];
    const delay = parseInt(el.dataset.delay || '500', 10);
    const speed = parseInt(el.dataset.speed || '80', 10);
    const pause = parseInt(el.dataset.pause || '1500', 10);
    const stopOnPause = el.dataset.stoponpause == 'true';
    const shouldLoop = el.dataset.loop !== 'false';

    let i = 0;
    let charIndex = 0;
    let typing = true;
    let isDone = false;
    let hasStarted = false;
    let lastTimestamp = 0;
    let timeout = 0;

    const typeLoopRAF = (timestamp) => {
      if (isDone || !hasStarted) return;

      if (timestamp - lastTimestamp < timeout) {
        requestAnimationFrame(typeLoopRAF);
        return;
      }

      lastTimestamp = timestamp;
      const currentText = strings[i];

      if (typing) {
        el.textContent = currentText.slice(0, charIndex + 1);
        charIndex++;

        if (charIndex <= currentText.length) {
          timeout = speed;
        } else {
          typing = false;
          const isLast = i === strings.length - 1;
          const shouldErase = shouldLoop || (!shouldLoop && !isLast);

          if (!shouldErase) {
            isDone = true;
            if (stopOnPause) {
              setTimeout(function() {
                el.classList.add('hideBlink')
              }, 1000)
            }
            return;
          }

          timeout = pause;
        }
      } else {
        charIndex--;
        el.textContent = currentText.slice(0, charIndex);

        if (charIndex > 0) {
          timeout = speed / 2;
        } else {
          el.textContent = '';
          typing = true;
          i = (i + 1) % strings.length;

          if (!shouldLoop && i === 0) {
            isDone = true;
            return;
          }

          timeout = delay;
        }
      }

      requestAnimationFrame(typeLoopRAF);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            el.style.opacity = '1';
            hasStarted = true;
            el.classList.add('animated')
            setTimeout(() => {
              lastTimestamp = 0;
              requestAnimationFrame(typeLoopRAF);
              timeout = 0;
            }, delay);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(el);
  });

  function animateElement(el) {
    const type = el.dataset.animation;
    const opacity = parseFloat(el.dataset.opacity || 1);
    const delay = parseFloat(el.dataset.delay || '0', 10) / 1000;
    const duration = parseFloat(el.dataset.duration || '500', 10) / 1000;
    const easing = el.dataset.easing || 'power2.out';

    let targets = [el];

    let baseConfig = { duration, ease: easing, delay, stagger: 0.05 };
    if (el.hasAttribute('data-splitting')) {
      const splitType = el.getAttribute('data-splitting') || "words";
      const split = new SplitText(el, { type: splitType });
      
      // Targets based on the type
      if (splitType === 'chars') targets = split.chars;
      else if (splitType === 'words') targets = split.words;
      else if (splitType === 'lines') targets = split.lines;
      el.style.opacity = '1'; // make container visible
      baseConfig = {
        ...baseConfig,
        transformOrigin: 'top',
        stagger: 0.1,
      }
      switch (type) {
        default:
          gsap.from(targets, { ...baseConfig, y: 30, opacity: 0, ease: 'power2.out' });
          break;
      }
      return;
    }


    switch (type) {
      case 'fade-up':
        gsap.fromTo(targets, { y: 50, opacity: 0 }, { y: 0, opacity, ...baseConfig });
        break;
      case 'fade-down':
        gsap.fromTo(targets, { y: -50, opacity: 0 }, { y: 0, opacity, ...baseConfig });
        break;
      case 'fade-left':
        gsap.fromTo(targets, { x: -50, opacity: 0 }, { x: 0, opacity, ...baseConfig });
        break;
      case 'fade-right':
        gsap.fromTo(targets, { x: 50, opacity: 0 }, { x: 0, opacity, ...baseConfig });
        break;
      case 'zoom-in':
        gsap.fromTo(targets, { scale: 0.8, opacity: 0 }, { scale: 1, opacity, ...baseConfig });
        break;
      case 'zoom-out':
        gsap.fromTo(targets, { scale: 1.2, opacity: 0 }, { scale: 1, opacity, ...baseConfig });
        break;
      case 'rotate':
        gsap.fromTo(targets, { rotation: 0, opacity: 0 }, { rotation: 90, opacity, ...baseConfig });
        break;
      case 'flip-x':
        gsap.fromTo(targets, { rotationY: -90, opacity: 0 }, { rotationY: 0, opacity, ...baseConfig });
        break;
      case 'flip-y':
        gsap.fromTo(targets, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity, ...baseConfig });
        break;
      case 'blur-in':
        gsap.fromTo(targets, { filter: "blur(5px)", opacity: 0 }, { filter: "blur(0px)", opacity, ...baseConfig });
        break;
    }
  }

  const animationObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      const once = el.dataset.once === "true";
      if (entry.isIntersecting) {
        if (!el.classList.contains('animated')) {
          animateElement(el);
          el.classList.add('animated');
        }
      } else if (!once) {
        el.classList.remove('animated');
      }
    });
  }, { threshold: 0 });

  document.querySelectorAll('[data-animation]').forEach(el => {
    const trigger = el.dataset.trigger || 'view';
    el.style.opacity = '0';

    if (trigger === 'view') {
      animationObserver.observe(el);
    } else if (trigger === 'hover') {
      el.addEventListener('mouseenter', () => {
        if (!el.classList.contains('animated')) {
          animateElement(el);
          el.classList.add('animated');
        }
      });
    }
  });
});
