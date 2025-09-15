document.addEventListener('DOMContentLoaded', () => {
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
              timeout = 0;
              requestAnimationFrame(typeLoopRAF);
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
    const delay = parseInt(el.dataset.delay || '0', 10);
    const duration = parseInt(el.dataset.duration || '500', 10);
    const easing = el.dataset.easing || 'easeOutCubic';
    const trigger = el.dataset.trigger || 'view';

    let targets;

    if (el.hasAttribute('data-splitting')) {
      const splitType = el.getAttribute('data-splitting');
      targets = el.querySelectorAll(splitType === 'words' ? '.word' : '.char');
      el.style.opacity = '1';
    } else if (type === 'type') {
      const text = el.textContent.trim();
      el.textContent = '';
      for (let char of text) {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char';
        span.style.opacity = '0';
        el.appendChild(span);
      }
      targets = el.querySelectorAll('.char');
    } else {
      targets = [el];
    }

    const props = {
      delay: stagger(50, { start: delay }),
      duration,
      easing,
      sync: .25,
      opacity: [0, opacity]
    };

    if (type === 'type') {
      animate(targets, {
        opacity: [0, opacity],
        duration: 30,
        delay: stagger(50, { start: delay }),
        easing: 'linear',
      });
    } else {
      switch (type) {
        case 'fade-up':     props.translateY = [50, 0]; break;
        case 'fade-down':   props.translateY = [-50, 0]; break;
        case 'fade-left':   props.translateX = [-50, 0]; break;
        case 'fade-right':  props.translateX = [50, 0]; break;
        case 'zoom-in':     props.scale = [0.8, 1]; break;
        case 'zoom-out':    props.scale = [1.2, 1]; break;
        case 'rotate':      props.rotate = [0, 90]; break;
        case 'flip-x':      props.rotateY = [-90, 0]; break;
        case 'flip-y':      props.rotateX = [-90, 0]; break;
        case 'scale-up':    props.scale = [0, 1]; break;
        case 'skew-up':
          props.translateY = [20, 0];
          props.skewY = [10, 0];
          break;
        case 'blur-in':
          props.filter = ['blur(5px)', 'blur(0px)'];
          break;
        case 'slide-up-peek':
          props.translateY = [100, 0];
          props.opacity = [0, opacity];
          break;
      }
      // console.log(props)
      animate(targets, props);
    }
  }

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const once = el.dataset.once === "true";
      if (entry.isIntersecting) {
        if (!el.classList.contains('animated')) {
          animateElement(el);
          el.classList.add('animated');
        }
      } else {
        if (!once) {
          el.classList.remove('animated');
        }
      }
    });
  }, {
    threshold: 0
  });

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
