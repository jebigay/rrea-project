let currentSlide = 0;

    function moveSlide(direction) {
      const carousel = document.getElementById("carousel");
      const slides = document.querySelectorAll(".testimonial");
      const total = slides.length;

      currentSlide = (currentSlide + direction + total) % total;
      const offset = -currentSlide * 100;
      carousel.style.transform = `translateX(${offset}%)`;
    }