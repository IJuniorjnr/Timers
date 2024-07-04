class Cronometro {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.tempoPadrao = 3600;
        this.tempoInicial = parseInt(localStorage.getItem(`${elementId}-tempoInicial`)) || this.tempoPadrao;
        this.timestamp = parseInt(localStorage.getItem(`${elementId}-timestamp`)) || null;
        this.emExecucao = false;
        this.corPadrao = "#f4f4f4";

        this.element.style.transition = 'background-color 0.5s ease';

        this.atualizarTempoDecorrido();
        this.atualizarInterface();

        if (this.timestamp) {
            this.iniciar();
        }

        document.addEventListener("visibilitychange", () => this.handleVisibilityChange());
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            this.atualizarTempoDecorrido();
            this.atualizarInterface();
        }
    }

    atualizarTempoDecorrido() {
        if (this.timestamp) {
            const now = Date.now() / 1000;
            const tempoDecorrido = now - this.timestamp;
            this.tempo = Math.max(this.tempoInicial - tempoDecorrido, 0);
            this.overtime = Math.max(tempoDecorrido - this.tempoInicial, 0);
        } else {
            this.tempo = this.tempoInicial;
            this.overtime = 0;
        }
    }

    iniciar() {
        if (!this.emExecucao) {
            this.emExecucao = true;
            if (!this.timestamp) {
                this.timestamp = Date.now() / 1000;
            }
            localStorage.setItem(`${this.element.id}-timestamp`, this.timestamp);
            this.atualizarLoop();
        }
    }

    atualizarLoop() {
        if (this.emExecucao) {
            this.atualizarTempoDecorrido();
            this.atualizarInterface();
            requestAnimationFrame(() => this.atualizarLoop());
        }
    }

    reiniciar() {
        showModal("Deseja realmente reiniciar o cronômetro?", () => {
            this.resetar();
        });
    }

    resetar() {
        this.tempoInicial = this.tempoPadrao;
        this.tempo = this.tempoPadrao;
        this.overtime = 0;
        this.timestamp = null;
        this.emExecucao = false;
        this.atualizarInterface();
        localStorage.removeItem(`${this.element.id}-tempoInicial`);
        localStorage.removeItem(`${this.element.id}-timestamp`);
    }

    atualizarInterface() {
        this.atualizarTempo();
        this.atualizarCor();
    }

    atualizarTempo() {
        const tempo = this.tempo > 0 ? this.tempo : this.overtime;
        const horas = Math.floor(tempo / 3600);
        const minutos = Math.floor((tempo % 3600) / 60);
        const segundos = Math.floor(tempo % 60);
        const sinal = this.tempo > 0 ? '' : '+';
        this.element.querySelector('.tempo').textContent = `${sinal}${this.formatarNumero(horas)}:${this.formatarNumero(minutos)}:${this.formatarNumero(segundos)}`;
    }

    atualizarCor() {
        let novaCor;

        if (!this.emExecucao) {
            novaCor = this.corPadrao;
            this.element.style.color = 'black';
        } else if (this.tempo > 0) {
            const progress = 1 - (this.tempo / this.tempoInicial);
            let r, g, b;
            
            if (progress < 0.5) {
                r = Math.round(255 * (2 * progress));
                g = 255;
                b = 0;
            } else {
                r = 255;
                g = Math.round(255 * (2 - 2 * progress));
                b = 0;
            }
            
            novaCor = `rgb(${r}, ${g}, ${b})`;
            this.element.style.color = 'black';
        } else {
            novaCor = 'black';
            this.element.style.color = 'white';
        }

        this.element.style.backgroundColor = novaCor;
    }

    formatarNumero(numero) {
        return numero < 10 ? `0${numero}` : numero;
    }

    static ordenarCronometros() {
        const container = document.querySelector('.container');
        const cronometros = Array.from(container.querySelectorAll('.cronometro')).filter(elem => elem.__cronometro);
        
        // Ordenar os cronômetros
        cronometros.sort((a, b) => {
            const cronometroA = a.__cronometro;
            const cronometroB = b.__cronometro;
            if (cronometroA.tempo === 0 && cronometroB.tempo === 0) {
                return cronometroB.overtime - cronometroA.overtime;
            } else if (cronometroA.tempo === 0) {
                return -1;
            } else if (cronometroB.tempo === 0) {
                return 1;
            } else {
                return cronometroA.tempo - cronometroB.tempo;
            }
        });
    
        // Reposicionar os elementos no DOM
        cronometros.forEach(elem => container.appendChild(elem));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const cronometros = document.querySelectorAll('[id^="cronometro-"]');
    cronometros.forEach(elem => {
        const cronometro = new Cronometro(elem.id);
        elem.__cronometro = cronometro;
    });

    setInterval(Cronometro.ordenarCronometros, 5000);
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        const cronometros = document.querySelectorAll('[id^="cronometro-"]');
        cronometros.forEach(elem => {
            const cronometro = elem.__cronometro;
            if (cronometro && cronometro.emExecucao) {
                cronometro.atualizarTempoDecorrido();
                cronometro.atualizarInterface();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const prefixoId = document.body.getAttribute('data-prefixo');
    const btnResetarTodos = document.getElementById('btnResetarTodos');
    const cronometros = [];

    for (let i = 1; i <= 45; i++) {
        const cronometroId = `${prefixoId}-${i.toString().padStart(2, '0')}`;
        const cronometro = new Cronometro(cronometroId);
        cronometros.push(cronometro);

        const btnIniciar = document.getElementById(`btnIniciar${i}`);
        btnIniciar.addEventListener('click', () => cronometro.iniciar());

        const btnReiniciar = document.getElementById(`btnReiniciar${i}`);
        btnReiniciar.addEventListener('click', () => cronometro.reiniciar());
    }

    btnResetarTodos.addEventListener('click', function () {
        showModal("Deseja realmente reiniciar todos os cronômetros?", () => {
            cronometros.forEach(cronometro => cronometro.resetar());
        });
    });

    function ordenarCronometros() {
        cronometros.sort((a, b) => {
            if (a.tempo === 0 && b.tempo === 0) {
                return b.overtime - a.overtime;
            } else if (a.tempo === 0) {
                return -1;
            } else if (b.tempo === 0) {
                return 1;
            } else {
                return a.tempo - b.tempo;
            }
        });

        const container = document.querySelector('.container');
        container.innerHTML = '';
        cronometros.forEach(cronometro => {
            container.appendChild(cronometro.element);
        });
    }

    setInterval(ordenarCronometros, 1000);

    document.getElementById('mostrarPrimeiras21').addEventListener('click', function () {
        for (let i = 1; i <= 45; i++) {
            const cronometroElement = document.getElementById(`${prefixoId}-${i.toString().padStart(2, '0')}`);
            cronometroElement.style.display = i <= 21 ? 'inline-block' : 'none';
        }
    });

    document.getElementById('mostrarRestantes').addEventListener('click', function () {
        for (let i = 1; i <= 45; i++) {
            const cronometroElement = document.getElementById(`${prefixoId}-${i.toString().padStart(2, '0')}`);
            cronometroElement.style.display = i > 21 ? 'inline-block' : 'none';
        }
    });

    document.getElementById('mostrarTodos').addEventListener('click', function () {
        for (let i = 1; i <= 45; i++) {
            const cronometroElement = document.getElementById(`${prefixoId}-${i.toString().padStart(2, '0')}`);
            cronometroElement.style.display = 'inline-block';
        }
    });
});

function showModal(message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmButton = document.getElementById('modalConfirm');
    const cancelButton = document.getElementById('modalCancel');

    modalMessage.textContent = message;
    modal.style.display = 'block';

    confirmButton.onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    cancelButton.onclick = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
    };
}

function hideModal() {
    document.getElementById('customModal').style.display = 'none';
}

window.onclick = (event) => {
    const modal = document.getElementById('customModal');
    if (event.target == modal) {
        hideModal();
    }
};