
/* ==========================================
   FUNCIONES GENERALES - SERVICIO SOCIAL EXUS
========================================== */

// Menú móvil
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });
}

/* ==========================================
   ENLACE ACTIVO SEGÚN EL DESPLAZAMIENTO
========================================== */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

if (sections.length && navLinks.length) {
    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();

            if (rect.top <= 120 && rect.bottom >= 120) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${current}`);
        });
    }, { passive: true });
}

/* ==========================================
   CONTADORES ANIMADOS DE ESTADÍSTICAS
========================================== */

const statNumbers = document.querySelectorAll('.stat-number');
const heroStats = document.querySelector('.hero-stats');

let countersStarted = false;

function animateCounters() {
    statNumbers.forEach(el => {
        const target = parseInt(el.getAttribute('data-count'), 10);

        if (!Number.isFinite(target)) {
            return;
        }

        let current = 0;
        const step = Math.max(1, Math.ceil(target / 40));

        const interval = setInterval(() => {
            current += step;

            if (current >= target) {
                current = target;
                clearInterval(interval);
            }

            el.textContent = current;
        }, 30);
    });
}

if (heroStats && statNumbers.length) {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersStarted) {
                    animateCounters();
                    countersStarted = true;
                    observer.disconnect();
                }
            });
        }, { threshold: 0.4 });

        observer.observe(heroStats);
    } else {
        animateCounters();
    }
}

/* ==========================================
   FILTROS DE DOCUMENTOS
   Compatibilidad con secciones anteriores
========================================== */

const filterButtons = document.querySelectorAll('.filter-btn');
const resourceCards = document.querySelectorAll('.resource-card');

if (filterButtons.length && resourceCards.length) {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
            });

            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            resourceCards.forEach(card => {
                const category = card.getAttribute('data-category');

                card.classList.toggle(
                    'hidden',
                    filter !== 'todos' && category !== filter
                );
            });
        });
    });
}

/* ==========================================
   CARRUSEL DE FOTOGRAFÍAS - EXUS
========================================== */

document.querySelectorAll('.exus-carousel').forEach(carrusel => {

    const fotos = Array.from(
        carrusel.querySelectorAll('.exus-carousel-slide')
    );

    const anterior = carrusel.querySelector(
        '.exus-carousel-prev'
    );

    const siguiente = carrusel.querySelector(
        '.exus-carousel-next'
    );

    const contador = carrusel.querySelector(
        '.exus-carousel-counter'
    );

    const dotsContainer =
        carrusel.nextElementSibling?.classList.contains('exus-carousel-dots')
            ? carrusel.nextElementSibling
            : null;

    if (!fotos.length) {
        return;
    }

    let fotoActual = 0;
    let inicioX = null;

    const puntos = [];

    /* CREACIÓN DE INDICADORES */

    if (dotsContainer) {
        dotsContainer.innerHTML = '';

        fotos.forEach((_, indice) => {
            const punto = document.createElement('button');

            punto.type = 'button';
            punto.className = 'exus-carousel-dot';

            punto.setAttribute(
                'aria-label',
                `Mostrar fotografía ${indice + 1}`
            );

            punto.addEventListener('click', () => {
                mostrarFoto(indice);
            });

            dotsContainer.appendChild(punto);
            puntos.push(punto);
        });
    }

    /* MOSTRAR FOTOGRAFÍA */

    function mostrarFoto(indice) {
        fotoActual = (indice + fotos.length) % fotos.length;

        fotos.forEach((foto, posicion) => {
            const activa = posicion === fotoActual;

            foto.classList.toggle('active', activa);
            foto.setAttribute('aria-hidden', String(!activa));
        });

        puntos.forEach((punto, posicion) => {
            const activa = posicion === fotoActual;

            punto.classList.toggle('active', activa);

            punto.setAttribute(
                'aria-current',
                activa ? 'true' : 'false'
            );
        });

        if (contador) {
            contador.textContent =
                `${fotoActual + 1} / ${fotos.length}`;
        }
    }

    /* BOTÓN ANTERIOR */

    if (anterior) {
        anterior.addEventListener('click', () => {
            mostrarFoto(fotoActual - 1);
        });
    }

    /* BOTÓN SIGUIENTE */

    if (siguiente) {
        siguiente.addEventListener('click', () => {
            mostrarFoto(fotoActual + 1);
        });
    }

    /* DESLIZAMIENTO TÁCTIL */

    carrusel.addEventListener('touchstart', evento => {
        inicioX = evento.changedTouches[0].screenX;
    }, { passive: true });

    carrusel.addEventListener('touchend', evento => {
        if (inicioX === null) {
            return;
        }

        const diferencia =
            inicioX - evento.changedTouches[0].screenX;

        inicioX = null;

        if (Math.abs(diferencia) < 50) {
            return;
        }

        if (diferencia > 0) {
            mostrarFoto(fotoActual + 1);
        } else {
            mostrarFoto(fotoActual - 1);
        }
    }, { passive: true });

    /* INICIAR CARRUSEL */

    mostrarFoto(0);
});


/* ====================================================
   CARRUSELES AUTOMÁTICOS EN PORTADAS DEL INDEX
   Las fotografías rotan cada segundo sin afectar a
   los carruseles manuales dentro de cada proyecto.
==================================================== */
(function iniciarPortadasAutomaticas() {
    const tarjetas = document.querySelectorAll('.card-image-rotator[data-images]');

    tarjetas.forEach(tarjeta => {
        const rutas = tarjeta.dataset.images.split('|').map(r => r.trim()).filter(Boolean);
        const frontal = tarjeta.querySelector('.card-image-front');
        const trasera = tarjeta.querySelector('.card-image-back');
        if (!frontal || !trasera || rutas.length < 2) return;

        // No presentar archivos que no se hayan podido cargar.
        const precargas = rutas.map((ruta, indice) => {
            const imagen = new Image();
            imagen.src = ruta;
            const resultado = { ruta, lista: indice === 0 };
            if (indice !== 0) {
                imagen.addEventListener('load', () => { resultado.lista = true; });
            }
            return resultado;
        });

        let indiceActual = 0;
        let mostrandoTrasera = false;
        let enTransicion = false;

        const cambiar = () => {
            if (document.hidden || enTransicion) return;
            let siguiente = indiceActual;
            for (let i = 1; i < precargas.length; i++) {
                const candidato = (indiceActual + i) % precargas.length;
                if (precargas[candidato].lista) {
                    siguiente = candidato;
                    break;
                }
            }
            if (siguiente === indiceActual) return;

            enTransicion = true;
            const destino = mostrandoTrasera ? frontal : trasera;
            const nuevaRuta = precargas[siguiente].ruta;
            const nuevoArchivo = new Image();
            nuevoArchivo.onload = () => {
                destino.src = nuevaRuta;
                // Se alternan capas para un fundido continuo.
                tarjeta.classList.toggle('show-back', !mostrandoTrasera);
                mostrandoTrasera = !mostrandoTrasera;
                indiceActual = siguiente;
                window.setTimeout(() => { enTransicion = false; }, 370);
            };
            nuevoArchivo.onerror = () => {
                precargas[siguiente].lista = false;
                enTransicion = false;
            };
            nuevoArchivo.src = nuevaRuta;
        };

        window.setInterval(cambiar, 2000);
    });
})();

