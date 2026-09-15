// live shorts row — sequential relay playback across four separate frames
  (function(){
    const order = ['sf-0','sf-1','sf-2','sf-3','sf-4','sf-5'];
    const frames = order.map(id => document.getElementById(id)).filter(Boolean);
    if(frames.length === 0) return;

    let idx = 0;
    let player = null;
    let inView = true;

    function clearActive(){
      frames.forEach(f => f.classList.remove('active'));
    }

    function movePlayerInto(frame){
      const mount = frame.querySelector('.sf-player');
      if(player && player.getIframe && mount){
        mount.appendChild(player.getIframe());
      }
    }

    function goToIndex(i){
      idx = i;
      const frame = frames[idx];
      clearActive();
      movePlayerInto(frame);
      if(player && player.loadVideoById){
        player.loadVideoById(frame.dataset.video);
      }
    }

    function playNext(){
      goToIndex((idx + 1) % frames.length);
    }

    function onPlayerStateChange(e){
      // only reveal the video / hide the play icon once it is truly playing
      if(e.data === YT.PlayerState.PLAYING){
        clearActive();
        frames[idx].classList.add('active');
      }
      if(e.data === YT.PlayerState.ENDED){
        playNext();
      }
    }

    function onPlayerReady(e){
      e.target.mute();
      movePlayerInto(frames[idx]);
      e.target.playVideo();
      startVisibilityWatch();
    }

    function onPlayerError(){
      // if a short is blocked/unavailable, skip gracefully to the next one
      playNext();
    }

    function createPlayer(){
      const mount = frames[0].querySelector('.sf-player');
      const holder = document.createElement('div');
      holder.id = 'shortsPlayerMount';
      mount.appendChild(holder);
      player = new YT.Player('shortsPlayerMount', {
        videoId: frames[0].dataset.video,
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, modestbranding: 1,
          playsinline: 1, rel: 0, loop: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    }

    if(window.YT && window.YT.Player){
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function(){
        if(typeof prevReady === 'function') prevReady();
        createPlayer();
      };
    }

    // pause when the row scrolls out of view, resume when back in view —
    // only starts watching once the player is ready, and debounces rapid
    // true/false flicker caused by fonts/images/layout settling on load
    let visibilityStarted = false;
    let debounceTimer = null;
    function startVisibilityWatch(){
      if(visibilityStarted || !('IntersectionObserver' in window)) return;
      visibilityStarted = true;
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          inView = entry.isIntersecting;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(()=>{
            if(!player || !player.playVideo) return;
            if(inView) player.playVideo();
            else player.pauseVideo();
          }, 400);
        });
      }, { threshold:0.3 });
      io.observe(frames[0].closest('.shorts-wrap'));
    }
  })();

  // headline scramble / decode-in effect
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scrambleWord(el, delay){
    const finalText = el.dataset.text || el.textContent;
    if(reduceMotion){ el.textContent = finalText; return; }
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=';
    const len = finalText.length;
    setTimeout(()=>{
      let frame = 0;
      const totalFrames = 22 + len * 3;
      const timer = setInterval(()=>{
        let out = '';
        for(let i=0;i<len;i++){
          const lockFrame = 10 + i * 3;
          if(frame >= lockFrame){ out += finalText[i]; }
          else if(finalText[i] === ' '){ out += ' '; }
          else{ out += glyphs[Math.floor(Math.random()*glyphs.length)]; }
        }
        el.textContent = out;
        frame++;
        if(frame > totalFrames){
          el.textContent = finalText;
          clearInterval(timer);
        }
      }, 32);
    }, delay);
  }
  let scrambleStarted = false;
  function startHeadlineScramble(){
    if(scrambleStarted) return;
    scrambleStarted = true;
    document.querySelectorAll('.scramble-word').forEach((el, i)=>{
      scrambleWord(el, 150 + i * 260);
    });
  }

  // logo intro splash
  (function(){
    const intro = document.getElementById('introScreen');
    if(!intro){ startHeadlineScramble(); return; }
    let dismissed = false;
    function dismissIntro(){
      if(dismissed) return;
      dismissed = true;
      intro.classList.add('hide');
      document.body.style.overflow = '';
      startHeadlineScramble();
      setTimeout(()=>{ intro.remove(); }, 600);
    }
    document.body.style.overflow = 'hidden';
    intro.addEventListener('click', dismissIntro);
    const autoDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 3600;
    setTimeout(dismissIntro, autoDelay);
  })();

  // marquee ticker
  const track = document.getElementById('marqueeTrack');
  if(track){
    const phrase = ['Real Conversations.', 'Real Impact.', 'Let\'s Talk Careers.', 'The HR\'s Universe by Recruvate.'];
    for(let rep=0; rep<2; rep++){
      phrase.forEach((t,i)=>{
        const s = document.createElement('span');
        if(i % 2 === 1) s.className = 'dim';
        s.textContent = t;
        track.appendChild(s);
      });
    }
  }

  // scroll progress bar
  const progressBar = document.getElementById('progressBar');
  window.addEventListener('scroll', ()=>{
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = scrolled + '%';
  });

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold:0.15 });
  revealEls.forEach(el=>io.observe(el));

  // cursor spotlight
  const glow = document.getElementById('cursorGlow');
  if(glow && window.matchMedia('(pointer:fine)').matches){
    window.addEventListener('mousemove', (e)=>{
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    }, { passive:true });
  }
